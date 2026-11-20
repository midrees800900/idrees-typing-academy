import { getUser, json } from "../_lib/auth.js";
export async function onRequestPost({ request, env }) {
  const user=await getUser(request,env); if(!user) return json({error:"Please sign in to start a saved assessment."},401);
  const body=await request.json().catch(()=>({})); const id=String(body.challenge_id||"");
  const row=await env.DB.prepare("SELECT id,completed_at,started_at FROM challenges WHERE id=? AND user_id=?").bind(id,user.id).first();
  if(!row||row.completed_at||row.started_at) return json({error:"This prepared test is unavailable. Prepare a new passage."},400);
  const now=new Date().toISOString(); await env.DB.prepare("UPDATE challenges SET started_at=? WHERE id=? AND user_id=?").bind(now,id,user.id).run();
  return json({started:true,started_at:now});
}