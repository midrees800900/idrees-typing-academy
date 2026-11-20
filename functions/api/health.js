import { json } from "../_lib/auth.js";
export async function onRequestGet({ env }) {
  if (!env.DB) return json({ ok:false, database:"not_bound", message:"Add the D1 binding named DB in Cloudflare Pages settings." },503);
  try { await env.DB.prepare("SELECT 1 AS ok").first(); return json({ok:true,database:"connected"}); }
  catch (error) { return json({ok:false,database:"error",message:"D1 query failed."},503); }
}