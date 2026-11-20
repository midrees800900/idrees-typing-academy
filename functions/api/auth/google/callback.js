import { json, randomToken, sha256, sessionCookie } from "../../../../_lib/auth.js";
function readCookie(request, name) { const raw=request.headers.get("Cookie")||""; for(const p of raw.split(";")){const i=p.indexOf("=");if(i>0&&p.slice(0,i).trim()===name)return decodeURIComponent(p.slice(i+1).trim())}return null; }
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const saved = readCookie(request, "ita_oauth_state");
  const clearState = "ita_oauth_state=; Path=/api/auth/google; HttpOnly; Secure; SameSite=Lax; Max-Age=0";
  const fail = (message) => new Response(`<!doctype html><meta charset="utf-8"><title>Sign-in issue</title><main style="font:16px system-ui;max-width:560px;margin:12vh auto;padding:24px"><h1>Could not sign you in</h1><p>${message}</p><a href="/login.html">Return to Idrees Typing Academy</a></main>`, { status: 400, headers: { "content-type":"text/html; charset=utf-8", "set-cookie":clearState, "cache-control":"no-store" } });
  if (!state || !saved || state !== saved) return fail("The sign-in request expired or could not be verified. Please try again.");
  if (!env.DB || !env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return fail("The database or Google sign-in settings are not connected yet.");
  const code = url.searchParams.get("code");
  if (!code) return fail("Google did not return an authorization code.");
  const redirectUri = url.origin + "/api/auth/google/callback";
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", { method:"POST", headers:{"content-type":"application/x-www-form-urlencoded"}, body:new URLSearchParams({code,client_id:env.GOOGLE_CLIENT_ID,client_secret:env.GOOGLE_CLIENT_SECRET,redirect_uri:redirectUri,grant_type:"authorization_code"}) });
  if (!tokenResponse.ok) return fail("Google could not complete sign-in. Check the OAuth redirect URL and credentials.");
  const tokens = await tokenResponse.json();
  if (!tokens.id_token) return fail("Google did not provide a verified identity token.");
  const infoResponse = await fetch("https://oauth2.googleapis.com/tokeninfo?id_token="+encodeURIComponent(tokens.id_token));
  if (!infoResponse.ok) return fail("Google identity verification failed.");
  const info = await infoResponse.json();
  if (info.aud !== env.GOOGLE_CLIENT_ID || !["accounts.google.com","https://accounts.google.com"].includes(info.iss) || info.email_verified !== "true" || !info.sub || !info.email) return fail("Google returned an identity that could not be verified.");
  const id = "g_"+info.sub;
  const name = String(info.name || info.given_name || "Academy learner").slice(0,80);
  const picture = info.picture || null;
  await env.DB.prepare("INSERT INTO users(id,google_sub,email,name,picture) VALUES(?,?,?,?,?) ON CONFLICT(google_sub) DO UPDATE SET email=excluded.email,name=excluded.name,picture=excluded.picture,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')").bind(id,info.sub,String(info.email).toLowerCase(),name,picture).run();
  const token = randomToken(32), tokenHash = await sha256(token);
  const expires = new Date(Date.now()+30*24*60*60*1000).toISOString();
  await env.DB.prepare("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)").bind(tokenHash,id,expires).run();
  return new Response(null,{status:302,headers:{"location":"/?signed_in=1","set-cookie":[sessionCookie(token),clearState],"cache-control":"no-store"}});
}