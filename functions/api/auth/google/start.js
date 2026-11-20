import { randomToken, json } from "../../../_lib/auth.js";
export async function onRequestGet({ request, env }) {
  if (!env.GOOGLE_CLIENT_ID) return new Response("<!doctype html><meta charset=\"utf-8\"><title>Sign-in setup needed</title><main style=\"font:16px system-ui;max-width:560px;margin:12vh auto;padding:24px\"><h1>Google sign-in is not connected yet</h1><p>The academy owner must finish the database and Google OAuth setup in Cloudflare before accounts can be used.</p><a href=\"/login.html\">Return to sign-in</a></main>", {status:503,headers:{"content-type":"text/html; charset=utf-8"}});
  const url = new URL(request.url);
  const state = randomToken(24);
  const redirectUri = url.origin + "/api/auth/google/callback";
  const target = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  target.search = new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, redirect_uri: redirectUri, response_type: "code", scope: "openid email profile", state, prompt: "select_account" });
  return Response.redirect(target.toString(), 302, { "set-cookie": `ita_oauth_state=${state}; Path=/api/auth/google; HttpOnly; Secure; SameSite=Lax; Max-Age=600`, "cache-control": "no-store" });
}