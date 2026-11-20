import { json } from "../_lib/auth.js";

// The shared API helpers live in functions/_lib, one directory above this file.
export async function onRequestGet({ request, env }) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return json({ error: "Certificate ID is required." }, 400);
  const row = await env.DB.prepare("SELECT id,display_name,language,wpm,accuracy,tier,duration_seconds,issued_at FROM certificates WHERE id=?").bind(id).first();
  if (!row) return json({ error: "No certificate was found with this ID." }, 404);
  return json({ verified: true, certificate: row });
}
