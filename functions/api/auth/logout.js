import { cookieValue, clearSessionCookie, json, sha256 } from "../../_lib/auth.js";
export async function onRequestPost({ request, env }) {
  const token = cookieValue(request, "ita_session");
  if (token && env.DB) await env.DB.prepare("DELETE FROM sessions WHERE token_hash=?").bind(await sha256(token)).run();
  return json({ ok: true }, 200, { "set-cookie": clearSessionCookie() });
}