import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.mjs";

test("le déclencheur planifié exécute les quatre purges attendues", async () => {
  const prepared = [];
  let batchSize = 0;
  const env = {
    DB: {
      prepare(sql) {
        return {
          bind(...values) {
            const statement = { sql, values };
            prepared.push(statement);
            return statement;
          }
        };
      },
      async batch(statements) {
        batchSize = statements.length;
        return statements.map(() => ({ success: true }));
      }
    }
  };
  let pending;
  const ctx = { waitUntil(promise) { pending = promise; } };

  await worker.scheduled({ cron: "17 * * * *", scheduledTime: Date.now() }, env, ctx);
  assert.ok(pending);
  await pending;

  assert.equal(batchSize, 4);
  assert.equal(prepared.length, 4);
  assert.match(prepared[0].sql, /rate_events/);
  assert.match(prepared[1].sql, /sync_nonces/);
  assert.match(prepared[2].sql, /expires_at/);
  assert.match(prepared[3].sql, /ACKED/);
});
