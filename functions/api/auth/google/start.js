import { randomToken, json } from "../../../_lib/auth.js";
export async function onRequestGet({ request, env }) {
  if (!env.GOOGLE_CLIENT_ID) return json({ error: "Google sign-in is not configured yet. The site owner must add the Google OAuth client ID in Cloudflare settings." }, 503);
  const url = new URL(request.url);
  const state = randomToken(24);
  const redirectUri = url.origin + "/api/auth/google/callback";
  const target = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  target.search = new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, redirect_uri: redirectUri, response_type: "code", scope: "openid email profile", state, prompt: "select_account" });
  return Response.redirect(target.toString(), 302, { "set-cookie": `ita_oauth_state=${state}; Path=/api/auth/google; HttpOnly; Secure; SameSite=Lax; Max-Age=600`, "cache-control": "no-store" });
}