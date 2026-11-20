import { getUser, json } from "../_lib/auth.js";
export async function onRequestGet({ request, env }) {
  const user=await getUser(request,env); if(!user) return json({error:"Sign in to view saved progress."},401);
  const [stats,attempts,certificates,days]=await Promise.all([
    env.DB.prepare("SELECT COUNT(*) AS tests,MAX(wpm) AS best_wpm,AVG(accuracy) AS avg_accuracy FROM attempts WHERE user_id=?").bind(user.id).first(),
    env.DB.prepare("SELECT id,language,wpm,accuracy,created_at,duration_seconds FROM attempts WHERE user_id=? ORDER BY created_at DESC LIMIT 50").bind(user.id).all(),
    env.DB.prepare("SELECT id,display_name,language,wpm,accuracy,tier,issued_at FROM certificates WHERE user_id=? ORDER BY issued_at DESC LIMIT 50").bind(user.id).all(),
    env.DB.prepare("SELECT DISTINCT substr(created_at,1,10) AS day FROM attempts WHERE user_id=? AND created_at>=datetime('now','-45 days') ORDER BY day DESC").bind(user.id).all()
  ]);
  const set=new Set((days.results||[]).map(x=>x.day)); let streak=0; let d=new Date(); const today=d.toISOString().slice(0,10); if(!set.has(today))d.setUTCDate(d.getUTCDate()-1);
  while(set.has(d.toISOString().slice(0,10))){streak++;d.setUTCDate(d.getUTCDate()-1)}
  return json({user,stats:{tests:Number(stats.tests||0),best_wpm:Number(stats.best_wpm||0),avg_accuracy:Number(stats.avg_accuracy||0),certificates:(certificates.results||[]).length,streak_days:streak},attempts:attempts.results||[],certificates:certificates.results||[]});
}