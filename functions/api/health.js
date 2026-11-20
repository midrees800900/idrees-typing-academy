import { json } from "../_lib/auth.js";

export async function onRequestGet({ env }) {
  const firebaseConfigured = ["FIREBASE_API_KEY", "FIREBASE_AUTH_DOMAIN", "FIREBASE_PROJECT_ID", "FIREBASE_APP_ID"].every(key => Boolean(env[key]));
  if (!env.DB) {
    return json({
      ready: false,
      database: "not_bound",
      schema: "unknown",
      google_sign_in: firebaseConfigured ? "configured" : "not_configured",
      message: "Connect the D1 database binding named DB in Cloudflare Pages."
    }, 503);
  }

  try {
    const names = ["users", "sessions", "challenges", "attempts", "certificates"];
    const rows = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('users','sessions','challenges','attempts','certificates')"
    ).all();
    const existing = new Set((rows.results || []).map(row => row.name));
    const missing = names.filter(name => !existing.has(name));
    const schemaReady = missing.length === 0;
    const ready = schemaReady && firebaseConfigured;
    return json({
      ready,
      database: "connected",
      schema: schemaReady ? "ready" : "migration_required",
      google_sign_in: firebaseConfigured ? "configured" : "not_configured",
      ...(missing.length ? { missing_tables: missing } : {}),
      message: ready
        ? "Database and Google sign-in configuration are ready."
        : !schemaReady
          ? "Run migrations/0001_schema.sql in the connected D1 database."
          : "Add the four Firebase configuration variables to Cloudflare Pages."
    }, ready ? 200 : 503);
  } catch (error) {
    return json({
      ready: false,
      database: "error",
      schema: "unknown",
      google_sign_in: firebaseConfigured ? "configured" : "not_configured",
      message: "The database is bound but could not be queried. Check the D1 binding and SQL migration."
    }, 503);
  }
}
