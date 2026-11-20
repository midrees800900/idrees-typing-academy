import { json, allowedLanguages } from "./_lib/auth.js";
export async function onRequestGet({ request, env }) {
  const language=new URL(request.url).searchParams.get("language")||"English";
  if(!allowedLanguages.includes(language)) return json({error:"Unsupported language."},400);
  const {results=[]}=await env.DB.prepare("SELECT display_name,language,MAX(wpm) AS wpm,MAX(accuracy) AS accuracy,COUNT(*) AS tests FROM attempts WHERE language=? GROUP BY user_id,display_name,language ORDER BY MAX(wpm) DESC,MAX(accuracy) DESC LIMIT 20").bind(language).all();
  return json({rows:results});
}