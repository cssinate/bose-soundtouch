import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

export function createDatabase(dataDir: string): Database.Database {
  const dbPath = resolve(dataDir, "soundtouch.db");
  mkdirSync(dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS oauth_tokens (
      service TEXT PRIMARY KEY,
      access_token TEXT NOT NULL,
      refresh_token TEXT,
      expires_at INTEGER,
      scope TEXT,
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS speakers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      host TEXT NOT NULL,
      port INTEGER NOT NULL DEFAULT 8090,
      model TEXT,
      discovered_at INTEGER NOT NULL DEFAULT (unixepoch()),
      last_seen_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS preferences (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  return db;
}

export interface OAuthTokenRow {
  service: string;
  access_token: string;
  refresh_token: string | null;
  expires_at: number | null;
  scope: string | null;
  updated_at: number;
}

export function getToken(
  db: Database.Database,
  service: string,
): OAuthTokenRow | undefined {
  return db
    .prepare("SELECT * FROM oauth_tokens WHERE service = ?")
    .get(service) as OAuthTokenRow | undefined;
}

export function upsertToken(
  db: Database.Database,
  service: string,
  accessToken: string,
  refreshToken?: string | null,
  expiresAt?: number | null,
  scope?: string | null,
): void {
  db.prepare(
    `INSERT INTO oauth_tokens (service, access_token, refresh_token, expires_at, scope, updated_at)
     VALUES (?, ?, ?, ?, ?, unixepoch())
     ON CONFLICT(service) DO UPDATE SET
       access_token = excluded.access_token,
       refresh_token = COALESCE(excluded.refresh_token, oauth_tokens.refresh_token),
       expires_at = excluded.expires_at,
       scope = excluded.scope,
       updated_at = unixepoch()`,
  )
    .run(service, accessToken, refreshToken ?? null, expiresAt ?? null, scope ?? null);
}

export function upsertSpeaker(
  db: Database.Database,
  id: string,
  name: string,
  host: string,
  port: number,
  model?: string,
): void {
  db.prepare(
    `INSERT INTO speakers (id, name, host, port, model)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       host = excluded.host,
       port = excluded.port,
       model = COALESCE(excluded.model, speakers.model),
       last_seen_at = unixepoch()`,
  )
    .run(id, name, host, port, model ?? null);
}

export function getAllSpeakers(db: Database.Database) {
  return db.prepare("SELECT * FROM speakers ORDER BY name").all();
}

export function getPreference(
  db: Database.Database,
  key: string,
): string | undefined {
  const row = db
    .prepare("SELECT value FROM preferences WHERE key = ?")
    .get(key) as { value: string } | undefined;
  return row?.value;
}

export function setPreference(
  db: Database.Database,
  key: string,
  value: string,
): void {
  db.prepare(
    `INSERT INTO preferences (key, value)
     VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
  ).run(key, value);
}
