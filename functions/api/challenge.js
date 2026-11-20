import { getUser, json, allowedLanguages, passages } from "../_lib/auth.js";
export async function onRequestPost({ request, env }) {
  const user=await getUser(request,env); if(!user) return json({error:"Sign in to save a test to your account. Guest practice remains available."},401);
  const body=await request.json().catch(()=>({})); const language=String(body.language||"English"); const duration=Number(body.duration);
  if(!allowedLanguages.includes(language)||![60,180,300].includes(duration)) return json({error:"Choose a supported language and test duration."},400);
  const prompt=passages[language].repeat(12).trim(); const id=crypto.randomUUID();
  await env.DB.prepare("INSERT INTO challenges(id,user_id,language,prompt,duration_seconds) VALUES(?,?,?,?,?)").bind(id,user.id,language,prompt,duration).run();
  return json({id,prompt,duration_seconds:duration});
}