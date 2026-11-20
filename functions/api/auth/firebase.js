import { json, randomToken, sha256, sessionCookie } from "../../_lib/auth.js";
function decodePart(value){const s=value.replace(/-/g,"+").replace(/_/g,"/");const padded=s+"=".repeat((4-s.length%4)%4);return Uint8Array.from(atob(padded),c=>c.charCodeAt(0))}
async function verifyIdToken(token,projectId){
 const parts=String(token||"").split(".");if(parts.length!==3)throw new Error("Invalid sign-in token");
 const header=JSON.parse(new TextDecoder().decode(decodePart(parts[0])));const claims=JSON.parse(new TextDecoder().decode(decodePart(parts[1])));
 if(header.alg!=="RS256"||!header.kid)throw new Error("Unsupported sign-in token");
 const keysResponse=await fetch("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com");
 if(!keysResponse.ok)throw new Error("Could not verify Google sign-in");
 const keys=(await keysResponse.json()).keys||[];const jwk=keys.find(k=>k.kid===header.kid);if(!jwk)throw new Error("Sign-in key was not recognized");
 const key=await crypto.subtle.importKey("jwk",jwk,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]);
 const signed=new TextEncoder().encode(parts[0]+"."+parts[1]);const valid=await crypto.subtle.verify("RSASSA-PKCS1-v1_5",key,decodePart(parts[2]),signed);
 const now=Math.floor(Date.now()/1000);
 if(!valid||claims.aud!==projectId||claims.iss!=="https://securetoken.google.com/"+projectId||!claims.sub||claims.sub.length>128||!claims.exp||claims.exp<now||!claims.iat||claims.iat>now+60||claims.email_verified!==true||!claims.email)throw new Error("Google account could not be verified");
 return claims;
}
export async function onRequestPost({request,env}){
 if(!env.DB||!env.FIREBASE_PROJECT_ID)return json({error:"Account service is not configured yet."},503);
 const body=await request.json().catch(()=>({}));
 try{
  const claims=await verifyIdToken(body.idToken,env.FIREBASE_PROJECT_ID);
  const id="fb_"+claims.sub;const email=String(claims.email).toLowerCase();const name=String(claims.name||claims.email.split("@")[0]||"Academy learner").slice(0,80);const picture=claims.picture||null;
  await env.DB.prepare("INSERT INTO users(id,google_sub,email,name,picture) VALUES(?,?,?,?,?) ON CONFLICT(google_sub) DO UPDATE SET email=excluded.email,name=excluded.name,picture=excluded.picture,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')").bind(id,claims.sub,email,name,picture).run();
  const token=randomToken(32),hash=await sha256(token),expires=new Date(Date.now()+30*24*60*60*1000).toISOString();
  await env.DB.prepare("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)").bind(hash,id,expires).run();
  return json({ok:true,user:{id,email,name,picture}},200,{"set-cookie":sessionCookie(token)});
 }catch(error){return json({error:"Google sign-in could not be verified. Please try again."},401)}
}