CREATE TABLE IF NOT EXISTS submissions (
  submission_id TEXT PRIMARY KEY,
  received_at TEXT NOT NULL,
  form_type TEXT NOT NULL,
  schema_version TEXT NOT NULL,
  form_version TEXT NOT NULL,
  notice_version TEXT NOT NULL,
  key_version TEXT NOT NULL,
  wrapped_key TEXT,
  iv TEXT,
  ciphertext TEXT,
  dedupe_tag TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'LEASED', 'ACKED', 'PURGE_DUE', 'QUARANTINED')),
  lease_until TEXT,
  leased_by TEXT,
  expires_at TEXT NOT NULL,
  acked_at TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_submissions_sync
  ON submissions(status, lease_until, received_at);
CREATE INDEX IF NOT EXISTS idx_submissions_expiry
  ON submissions(expires_at);

CREATE TABLE IF NOT EXISTS rate_events (
  event_id TEXT PRIMARY KEY,
  network_tag TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_events_window
  ON rate_events(network_tag, created_at);
CREATE INDEX IF NOT EXISTS idx_rate_events_expiry
  ON rate_events(expires_at);

CREATE TABLE IF NOT EXISTS sync_nonces (
  nonce TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  used_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sync_nonces_expiry
  ON sync_nonces(expires_at);

