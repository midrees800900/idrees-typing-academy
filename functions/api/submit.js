import { getUser, json, tierFor } from "../_lib/auth.js";
export async function onRequestPost({ request, env }) {
  const user=await getUser(request,env); if(!user) return json({error:"Sign in to save a permanent certificate. Guest certificates remain available on this device."},401);
  const body=await request.json().catch(()=>({})); const challengeId=String(body.challenge_id||""); const typed=String(body.typed||""); const requestedName=String(body.display_name||"").trim().slice(0,80);
  if(requestedName.length<2||requestedName.includes("@")) return json({error:"Enter your name, not your email address, for the certificate."},400);
  if(!challengeId||typed.length<10||typed.length>12000) return json({error:"The submitted typing text is invalid."},400);
  const c=await env.DB.prepare("SELECT * FROM challenges WHERE id=? AND user_id=?").bind(challengeId,user.id).first();
  if(!c||c.completed_at||!c.started_at) return json({error:"This test is invalid, already submitted, or was not started."},400);
  const elapsed=Math.max(1,Math.floor((Date.now()-Date.parse(c.started_at))/1000));
  if(elapsed<Math.floor(c.duration_seconds*0.9)) return json({error:"Complete at least 90% of the selected test time before submitting for a certificate."},400);
  if(typed.length>c.prompt.length) return json({error:"The submitted text is longer than the prepared passage."},400);
  let correct=0; for(let i=0;i<typed.length;i++) if(typed[i]===c.prompt[i]) correct++;
  const accuracy=typed.length?correct/typed.length*100:0; const wpm=correct/5/(elapsed/60);
  if(!Number.isFinite(wpm)||wpm>250) return json({error:"The result could not be validated."},400);
  const attemptId=crypto.randomUUID(), certificateId=crypto.randomUUID(), tier=tierFor(wpm,accuracy), name=requestedName;
  await env.DB.batch([
    env.DB.prepare("UPDATE challenges SET completed_at=? WHERE id=? AND user_id=?").bind(new Date().toISOString(),challengeId,user.id),
    env.DB.prepare("INSERT INTO attempts(id,user_id,display_name,language,duration_seconds,wpm,accuracy,correct_chars,total_chars) VALUES(?,?,?,?,?,?,?,?,?)").bind(attemptId,user.id,name,c.language,elapsed,wpm,accuracy,correct,typed.length),
    env.DB.prepare("INSERT INTO certificates(id,user_id,attempt_id,display_name,language,wpm,accuracy,tier,duration_seconds) VALUES(?,?,?,?,?,?,?,?,?)").bind(certificateId,user.id,attemptId,name,c.language,wpm,accuracy,tier,elapsed)
  ]);
  return json({attempt:{id:attemptId,wpm:Number(wpm.toFixed(1)),accuracy:Number(accuracy.toFixed(1)),duration_seconds:elapsed},certificate:{id:certificateId,display_name:name,language:c.language,wpm:Number(wpm.toFixed(1)),accuracy:Number(accuracy.toFixed(1)),tier}});
}