import { getUser, json } from "../../_lib/auth.js";
export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ error: "Database is not connected yet." }, 503);
  return json({ user: await getUser(request, env) });
}