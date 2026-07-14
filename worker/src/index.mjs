import { IntakeError, validateSubmission } from "./validation.mjs";
import { bytesToBase64Url, encryptEnvelope, hmac, hmacTag, secureEqual, sha256 } from "./crypto.mjs";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "content-security-policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY"
};

function response(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...JSON_HEADERS, ...extraHeaders } });
}

function allowedOrigins(env) {
  return new Set(String(env.ALLOWED_ORIGINS || "").split(",").map((value) => value.trim()).filter(Boolean));
}

function corsHeaders(request, env) {
  const origin = request.headers.get("origin") || "";
  if (!allowedOrigins(env).has(origin)) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type, x-vestiges-test-token",
    "access-control-max-age": "600",
    "vary": "Origin"
  };
}

function isoAfter(milliseconds) {
  return new Date(Date.now() + milliseconds).toISOString();
}

function requireSecrets(env, names) {
  for (const name of names) {
    if (typeof env[name] !== "string" || env[name].length < 24) {
      throw new IntakeError("TEMPORARILY_UNAVAILABLE", 503);
    }
  }
}

async function requireIntakeAccess(request, env) {
  if (env.INTAKE_MODE === "open") return "PRODUCTION";
  if (env.INTAKE_MODE !== "test" || !env.TEST_TOKEN || !(await secureEqual(request.headers.get("x-vestiges-test-token") || "", env.TEST_TOKEN))) {
    throw new IntakeError("TEMPORARILY_UNAVAILABLE", 503);
  }
  return "TEST_OWNER";
}

export async function verifyTurnstile(token, request, env, origin) {
  if (env.TURNSTILE_REQUIRED !== "true") return;
  if (!token || !env.TURNSTILE_SECRET) throw new IntakeError("CHALLENGE_FAILED", 403);
  let verification;
  let result;
  try {
    verification = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ secret: env.TURNSTILE_SECRET, response: token, remoteip: request.headers.get("CF-Connecting-IP") || undefined }),
      signal: AbortSignal.timeout(5000)
    });
    result = await verification.json();
  } catch {
    throw new IntakeError("TEMPORARILY_UNAVAILABLE", 503);
  }
  let expectedHostname = "";
  try { expectedHostname = new URL(origin).hostname; } catch { throw new IntakeError("CHALLENGE_FAILED", 403); }
  const expectedAction = String(env.TURNSTILE_EXPECTED_ACTION || "vestiges_intake");
  if (!verification.ok || !result.success || result.action !== expectedAction || result.hostname !== expectedHostname) {
    throw new IntakeError("CHALLENGE_FAILED", 403);
  }
}

async function enforceRateLimit(request, env) {
  const network = request.headers.get("CF-Connecting-IP") || "local";
  const tag = await hmacTag(env.RATE_LIMIT_SECRET, network);
  const cutoff = new Date(Date.now() - Number(env.RATE_LIMIT_MINUTES || 10) * 60000).toISOString();
  const row = await env.DB.prepare("SELECT COUNT(*) AS count FROM rate_events WHERE network_tag = ? AND created_at >= ?").bind(tag, cutoff).first();
  if (Number(row?.count || 0) >= Number(env.RATE_LIMIT_COUNT || 5)) throw new IntakeError("RATE_LIMITED", 429);
  await env.DB.prepare("INSERT INTO rate_events (event_id, network_tag, created_at, expires_at) VALUES (?, ?, ?, ?)")
    .bind(crypto.randomUUID(), tag, new Date().toISOString(), isoAfter(Number(env.RATE_LIMIT_MINUTES || 10) * 60000)).run();
}

async function acceptSubmission(request, env) {
  const cors = corsHeaders(request, env);
  const origin = request.headers.get("origin") || "";
  if (!allowedOrigins(env).has(origin)) throw new IntakeError("INVALID_REQUEST", 403);
  const accessMode = await requireIntakeAccess(request, env);
  requireSecrets(env, ["DEDUPE_SECRET", "RATE_LIMIT_SECRET", "ENCRYPTION_PUBLIC_KEY_SPKI"]);

  const contentType = request.headers.get("content-type") || "";
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (!contentType.toLowerCase().startsWith("application/json")) throw new IntakeError();
  if (declaredLength > 16384) throw new IntakeError("TOO_LARGE", 413);
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > 16384) throw new IntakeError("TOO_LARGE", 413);

  let parsed;
  try { parsed = JSON.parse(raw); } catch { throw new IntakeError(); }
  await verifyTurnstile(parsed.turnstile_token, request, env, origin);
  const clean = validateSubmission(parsed);
  if (accessMode === "TEST_OWNER" && (clean.form_version !== "landing.test-owner.v0.1" || clean.notice_version !== "privacy.test-owner.v0.1")) {
    throw new IntakeError("INVALID_REQUEST", 403);
  }
  await enforceRateLimit(request, env);

  const canonical = JSON.stringify(clean);
  const dedupeTag = await hmacTag(env.DEDUPE_SECRET, JSON.stringify({ ...clean, request_id: "" }));
  const duplicate = await env.DB.prepare("SELECT submission_id FROM submissions WHERE dedupe_tag = ? AND expires_at > ?")
    .bind(dedupeTag, new Date().toISOString()).first();
  if (duplicate) return response({ status: "ACCEPTED", submission_id: duplicate.submission_id, contract_version: clean.schema_version, mode: accessMode }, 202, cors);

  const encrypted = await encryptEnvelope(clean, env.ENCRYPTION_PUBLIC_KEY_SPKI);
  const submissionId = crypto.randomUUID();
  const receivedAt = new Date().toISOString();
  const expiresAt = isoAfter(Number(env.RETENTION_HOURS || 168) * 3600000);
  try {
    await env.DB.prepare(`INSERT INTO submissions (
      submission_id, received_at, form_type, schema_version, form_version, notice_version, key_version,
      wrapped_key, iv, ciphertext, dedupe_tag, status, expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)`)
      .bind(submissionId, receivedAt, clean.form_type, clean.schema_version, clean.form_version, clean.notice_version,
        env.KEY_VERSION, encrypted.wrapped_key, encrypted.iv, encrypted.ciphertext, dedupeTag, expiresAt).run();
  } catch (error) {
    const concurrentDuplicate = await env.DB.prepare("SELECT submission_id FROM submissions WHERE dedupe_tag = ? AND expires_at > ?")
      .bind(dedupeTag, new Date().toISOString()).first();
    if (concurrentDuplicate) {
      return response({ status: "ACCEPTED", submission_id: concurrentDuplicate.submission_id, contract_version: clean.schema_version, mode: accessMode }, 202, cors);
    }
    throw error;
  }
  return response({ status: "ACCEPTED", submission_id: submissionId, contract_version: clean.schema_version, mode: accessMode }, 202, cors);
}

async function authenticateSync(request, body, env) {
  requireSecrets(env, ["SYNC_HMAC_SECRET"]);
  if (typeof env.SYNC_CLIENT_ID !== "string" || env.SYNC_CLIENT_ID.length < 8) {
    throw new IntakeError("TEMPORARILY_UNAVAILABLE", 503);
  }
  const client = request.headers.get("x-vestiges-client") || "";
  const timestamp = request.headers.get("x-vestiges-timestamp") || "";
  const nonce = request.headers.get("x-vestiges-nonce") || "";
  const signature = request.headers.get("x-vestiges-signature") || "";
  if (!client || client !== env.SYNC_CLIENT_ID || !/^\d{10,13}$/.test(timestamp) || !/^[a-zA-Z0-9_-]{16,128}$/.test(nonce)) throw new IntakeError("INVALID_REQUEST", 401);
  const timestampMs = timestamp.length === 10 ? Number(timestamp) * 1000 : Number(timestamp);
  if (Math.abs(Date.now() - timestampMs) > 300000) throw new IntakeError("INVALID_REQUEST", 401);
  const bodyHash = bytesToBase64Url(await sha256(body));
  const message = [request.method, new URL(request.url).pathname, client, timestamp, nonce, bodyHash].join("\n");
  const expected = bytesToBase64Url(await hmac(env.SYNC_HMAC_SECRET, message));
  if (!(await secureEqual(signature, expected))) throw new IntakeError("INVALID_REQUEST", 401);
  try {
    await env.DB.prepare("INSERT INTO sync_nonces (nonce, client_id, used_at, expires_at) VALUES (?, ?, ?, ?)")
      .bind(nonce, client, new Date().toISOString(), isoAfter(600000)).run();
  } catch { throw new IntakeError("INVALID_REQUEST", 401); }
  return client;
}

async function syncBatch(request, env) {
  const client = await authenticateSync(request, "", env);
  const leaseUntil = isoAfter(Number(env.LEASE_MINUTES || 15) * 60000);
  const now = new Date().toISOString();
  const { results = [] } = await env.DB.prepare(`SELECT submission_id, received_at, form_type, schema_version,
    form_version, notice_version, key_version, wrapped_key, iv, ciphertext, expires_at
    FROM submissions WHERE ciphertext IS NOT NULL AND expires_at > ?
    AND (status = 'PENDING' OR (status = 'LEASED' AND lease_until < ?))
    ORDER BY received_at LIMIT 25`).bind(now, now).all();
  if (results.length) {
    await env.DB.batch(results.map((item) => env.DB.prepare(`UPDATE submissions SET status = 'LEASED',
      lease_until = ?, leased_by = ?, attempt_count = attempt_count + 1 WHERE submission_id = ?`)
      .bind(leaseUntil, client, item.submission_id)));
  }
  return response({ status: "OK", lease_until: leaseUntil, items: results });
}

async function syncAck(request, env) {
  const body = await request.text();
  const client = await authenticateSync(request, body, env);
  let parsed;
  try { parsed = JSON.parse(body); } catch { throw new IntakeError(); }
  if (!Array.isArray(parsed.submission_ids) || parsed.submission_ids.length < 1 || parsed.submission_ids.length > 25) throw new IntakeError();
  if (parsed.submission_ids.some((id) => typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id))) throw new IntakeError();
  const now = new Date().toISOString();
  const results = await env.DB.batch(parsed.submission_ids.map((id) => env.DB.prepare(`UPDATE submissions SET status = 'ACKED',
    wrapped_key = NULL, iv = NULL, ciphertext = NULL, acked_at = ?, lease_until = NULL, leased_by = NULL
    WHERE submission_id = ? AND status = 'LEASED' AND leased_by = ? AND lease_until >= ?`)
    .bind(now, id, client, now)));
  const count = results.reduce((total, result) => total + Number(result.meta?.changes || 0), 0);
  return response({ status: "ACKED", count });
}

async function purge(env) {
  const now = new Date().toISOString();
  const ackCutoff = new Date(Date.now() - 86400000).toISOString();
  await env.DB.batch([
    env.DB.prepare("DELETE FROM rate_events WHERE expires_at <= ?").bind(now),
    env.DB.prepare("DELETE FROM sync_nonces WHERE expires_at <= ?").bind(now),
    env.DB.prepare("DELETE FROM submissions WHERE expires_at <= ?").bind(now),
    env.DB.prepare("DELETE FROM submissions WHERE status = 'ACKED' AND acked_at <= ?").bind(ackCutoff)
  ]);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/v1/status") {
      const mode = env.INTAKE_MODE === "open" ? "open" : env.INTAKE_MODE === "test" ? "test" : "closed";
      return response({ status: "OK", mode, contract_version: "vestiges.intake.v1" });
    }
    if (request.method === "OPTIONS" && url.pathname === "/v1/submissions") {
      const headers = corsHeaders(request, env);
      if (!headers["access-control-allow-origin"]) return new Response(null, { status: 403 });
      return new Response(null, { status: 204, headers });
    }
    try {
      if (request.method === "POST" && url.pathname === "/v1/submissions") return await acceptSubmission(request, env);
      if (request.method === "GET" && url.pathname === "/v1/sync/batch") return await syncBatch(request, env);
      if (request.method === "POST" && url.pathname === "/v1/sync/ack") return await syncAck(request, env);
      return response({ status: "REJECTED", code: "INVALID_REQUEST" }, 404);
    } catch (error) {
      const known = error instanceof IntakeError;
      const status = known ? error.status : 503;
      const code = known ? error.code : "TEMPORARILY_UNAVAILABLE";
      const cors = url.pathname === "/v1/submissions" ? corsHeaders(request, env) : {};
      return response({ status: status >= 500 ? "RETRY" : "REJECTED", code }, status, cors);
    }
  },
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(purge(env));
  }
};
