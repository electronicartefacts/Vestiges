import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, privateDecrypt, constants } from "node:crypto";
import { validateSubmission } from "../src/validation.mjs";
import { base64ToBytes, encryptEnvelope } from "../src/crypto.mjs";

function valid(overrides = {}) {
  const now = Date.now();
  return {
    schema_version: "vestiges.intake.v1",
    form_type: "PRACTITIONER",
    form_version: "landing.v0.1",
    notice_version: "privacy.draft.v0.1",
    locale: "fr-FR",
    started_at: new Date(now - 5000).toISOString(),
    website: "",
    data: {
      display_name: "Camille Test",
      email: "camille@example.org",
      territory: "Auvergne",
      professional_url: "https://example.org/atelier",
      purpose: "EDITORIAL_EXCHANGE",
      message: "Donnée fictive de validation.",
      practice_name: "Céramique fictive",
      practice_domain: "MATERIAL_CRAFT"
    },
    notice_acknowledged: true,
    ...overrides
  };
}

test("normalise une soumission praticien conforme", () => {
  const now = Date.now();
  const result = validateSubmission(valid({ started_at: new Date(now - 5000).toISOString() }), now);
  assert.equal(result.data.email, "camille@example.org");
  assert.equal(result.data.practice_domain, "MATERIAL_CRAFT");
  assert.equal(result.data.message, "Donnée fictive de validation.");
});

test("rejette un champ inconnu", () => {
  assert.throws(() => validateSubmission({ ...valid(), unexpected: true }));
});

test("rejette le honeypot rempli", () => {
  assert.throws(() => validateSubmission(valid({ website: "bot" })));
});

test("rejette une soumission trop rapide", () => {
  const now = Date.now();
  assert.throws(() => validateSubmission(valid({ started_at: new Date(now - 100).toISOString() }), now));
});

test("rejette une branche et un enum incohérents", () => {
  const payload = valid();
  payload.data.practice_domain = "MUSEUM";
  assert.throws(() => validateSubmission(payload));
});

test("rejette un message supérieur à 800 caractères", () => {
  const payload = valid();
  payload.data.message = "x".repeat(801);
  assert.throws(() => validateSubmission(payload));
});

test("l'enveloppe RSA/AES est déchiffrable uniquement avec la clé privée", async () => {
  const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const spki = publicKey.export({ type: "spki", format: "der" }).toString("base64");
  const payload = validateSubmission(valid());
  const envelope = await encryptEnvelope(payload, spki);
  const rawKey = privateDecrypt({ key: privateKey, oaepHash: "sha256", padding: constants.RSA_PKCS1_OAEP_PADDING }, Buffer.from(envelope.wrapped_key, "base64"));
  const aesKey = await crypto.subtle.importKey("raw", rawKey, "AES-GCM", false, ["decrypt"]);
  const clear = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64ToBytes(envelope.iv) }, aesKey, base64ToBytes(envelope.ciphertext));
  assert.deepEqual(JSON.parse(new TextDecoder().decode(clear)), payload);
});

