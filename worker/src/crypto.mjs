const encoder = new TextEncoder();

export function bytesToBase64(bytes) {
  let binary = "";
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function base64ToBytes(value) {
  const binary = atob(value.replace(/\s+/g, ""));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function bytesToBase64Url(bytes) {
  return bytesToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function sha256(value) {
  return crypto.subtle.digest("SHA-256", typeof value === "string" ? encoder.encode(value) : value);
}

export async function hmac(secret, value) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", key, encoder.encode(value));
}

export async function hmacTag(secret, value) {
  return bytesToBase64Url(await hmac(secret, value));
}

export async function secureEqual(left, right) {
  if (typeof left !== "string" || typeof right !== "string") return false;
  const leftHash = new Uint8Array(await sha256(left));
  const rightHash = new Uint8Array(await sha256(right));
  let difference = 0;
  for (let index = 0; index < leftHash.length; index += 1) difference |= leftHash[index] ^ rightHash[index];
  return difference === 0;
}

export async function encryptEnvelope(payload, spkiBase64) {
  const publicKey = await crypto.subtle.importKey(
    "spki",
    base64ToBytes(spkiBase64),
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"]
  );
  const aesKey = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt"]);
  const rawKey = await crypto.subtle.exportKey("raw", aesKey);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, encoder.encode(JSON.stringify(payload)));
  const wrappedKey = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, publicKey, rawKey);
  return {
    wrapped_key: bytesToBase64(wrappedKey),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(ciphertext)
  };
}

