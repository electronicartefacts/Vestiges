import test from "node:test";
import assert from "node:assert/strict";
import worker, { verifyTurnstile } from "../src/index.mjs";

const request = new Request("https://intake.vestiges.world/v1/submissions", {
  headers: { "CF-Connecting-IP": "192.0.2.1" }
});

async function withFetch(result, callback) {
  const previous = globalThis.fetch;
  globalThis.fetch = async () => Response.json(result);
  try { await callback(); } finally { globalThis.fetch = previous; }
}

test("Turnstile exige l'action et le domaine exacts", async () => {
  const env = { TURNSTILE_REQUIRED: "true", TURNSTILE_SECRET: "x".repeat(32), TURNSTILE_EXPECTED_ACTION: "vestiges_intake" };
  await withFetch({ success: true, action: "vestiges_intake", hostname: "vestiges.world" }, async () => {
    await verifyTurnstile("token", request, env, "https://vestiges.world");
  });
  await withFetch({ success: true, action: "other", hostname: "vestiges.world" }, async () => {
    await assert.rejects(() => verifyTurnstile("token", request, env, "https://vestiges.world"), /CHALLENGE_FAILED/);
  });
  await withFetch({ success: true, action: "vestiges_intake", hostname: "attacker.example" }, async () => {
    await assert.rejects(() => verifyTurnstile("token", request, env, "https://vestiges.world"), /CHALLENGE_FAILED/);
  });
});

test("les réponses API portent les en-têtes de durcissement", async () => {
  const response = await worker.fetch(new Request("https://intake.vestiges.world/v1/status"), { INTAKE_MODE: "closed" });
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.match(response.headers.get("content-security-policy"), /default-src 'none'/);
});
