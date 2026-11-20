import { json } from "../../_lib/auth.js";
export async function onRequestGet({ env }) {
  const required=["FIREBASE_API_KEY","FIREBASE_AUTH_DOMAIN","FIREBASE_PROJECT_ID","FIREBASE_APP_ID"];
  if(required.some(k=>!env[k])) return json({configured:false},503);
  return json({configured:true,config:{apiKey:env.FIREBASE_API_KEY,authDomain:env.FIREBASE_AUTH_DOMAIN,projectId:env.FIREBASE_PROJECT_ID,appId:env.FIREBASE_APP_ID}});
}