import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import worker from "../src/index.mjs";

function fakeDatabase() {
  const submissions = [];
  const rateEvents = [];
  return {
    submissions,
    rateEvents,
    prepare(sql) {
      return {
        bind(...values) {
          return {
            async first() {
              if (sql.includes("rate_events")) return { count: rateEvents.length };
              if (sql.includes("FROM submissions WHERE dedupe_tag")) {
                const row = submissions.find((entry) => entry.dedupe_tag === values[0]);
                return row ? { submission_id: row.submission_id } : null;
              }
              throw new Error("UNEXPECTED_FIRST");
            },
            async run() {
              if (sql.includes("INSERT INTO rate_events")) {
                rateEvents.push({ event_id: values[0], network_tag: values[1] });
                return { success: true };
              }
              if (sql.includes("INSERT INTO submissions")) {
                submissions.push({
                  submission_id: values[0],
                  wrapped_key: values[7],
                  iv: values[8],
                  ciphertext: values[9],
                  dedupe_tag: values[10]
                });
                return { success: true };
              }
              throw new Error("UNEXPECTED_RUN");
            }
          };
        }
      };
    }
  };
}

function submission() {
  return {
    schema_version: "vestiges.intake.v1",
    form_type: "PRACTITIONER",
    form_version: "landing.v0.1",
    notice_version: "privacy.draft.v0.1",
    locale: "fr-FR",
    started_at: new Date(Date.now() - 5000).toISOString(),
    website: "",
    data: {
      display_name: "Personne fictive",
      email: "fictive@example.invalid",
      territory: "Territoire fictif",
      professional_url: "https://example.invalid/atelier",
      purpose: "EDITORIAL_EXCHANGE",
      message: "Donnée synthétique réservée au test local.",
      practice_name: "Pratique fictive",
      practice_domain: "MATERIAL_CRAFT"
    },
    notice_acknowledged: true
  };
}

test("accepte, chiffre et déduplique une soumission sans exposer son contenu", async () => {
  const { publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const DB = fakeDatabase();
  const env = {
    DB,
    INTAKE_MODE: "open",
    ALLOWED_ORIGINS: "https://vestiges.world",
    TURNSTILE_REQUIRED: "false",
    DEDUPE_SECRET: "d".repeat(32),
    RATE_LIMIT_SECRET: "r".repeat(32),
    ENCRYPTION_PUBLIC_KEY_SPKI: publicKey.export({ type: "spki", format: "der" }).toString("base64"),
    RATE_LIMIT_MINUTES: "10",
    RATE_LIMIT_COUNT: "5",
    RETENTION_HOURS: "168",
    KEY_VERSION: "test-v1"
  };
  const makeRequest = () => new Request("https://intake.vestiges.world/v1/submissions", {
    method: "POST",
    headers: {
      origin: "https://vestiges.world",
      "content-type": "application/json",
      "CF-Connecting-IP": "192.0.2.10"
    },
    body: JSON.stringify(submission())
  });

  const first = await worker.fetch(makeRequest(), env);
  const firstBody = await first.json();
  assert.equal(first.status, 202);
  assert.equal(firstBody.status, "ACCEPTED");
  assert.equal(DB.submissions.length, 1);
  assert.ok(DB.submissions[0].wrapped_key);
  assert.ok(DB.submissions[0].ciphertext);
  assert.doesNotMatch(DB.submissions[0].ciphertext, /Personne fictive/);

  const second = await worker.fetch(makeRequest(), env);
  const secondBody = await second.json();
  assert.equal(second.status, 202);
  assert.equal(secondBody.submission_id, firstBody.submission_id);
  assert.equal(DB.submissions.length, 1);
  assert.equal(DB.rateEvents.length, 2);
});
