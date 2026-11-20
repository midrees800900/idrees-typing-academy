const COOKIE = "ita_session";
export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers } });
}
export function cookieValue(request, name) {
  const raw = request.headers.get("Cookie") || "";
  for (const part of raw.split(";")) {
    const i = part.indexOf("=");
    if (i > -1 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
}
export async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("");
}
export function randomToken(bytes = 32) {
  const data = new Uint8Array(bytes);
  crypto.getRandomValues(data);
  return [...data].map(b => b.toString(16).padStart(2, "0")).join("");
}
export async function getUser(request, env) {
  const token = cookieValue(request, COOKIE);
  if (!token || !env.DB) return null;
  const tokenHash = await sha256(token);
  const row = await env.DB.prepare("SELECT u.id,u.email,u.name,u.picture FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at > ?").bind(tokenHash, new Date().toISOString()).first();
  return row || null;
}
export function sessionCookie(token, maxAge = 2592000) {
  return `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}
export function clearSessionCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}
export function tierFor(wpm, accuracy) {
  if (wpm >= 70 && accuracy >= 98) return "Diamond";
  if (wpm >= 50 && accuracy >= 96) return "Gold";
  if (wpm >= 35 && accuracy >= 94) return "Bismuth";
  if (wpm >= 20 && accuracy >= 90) return "Silver";
  return "Bronze";
}
export const allowedLanguages = ["English", "Urdu", "Spanish", "French"];
export const passages = {
 English: "Typing is a skill that improves through calm and regular practice. Keep your fingers relaxed, look at the screen, and focus on entering each character accurately. Good technique creates a strong foundation for speed. Learning takes patience, attention, and consistency. Small improvements add up over time. A confident typist works steadily, reads carefully, and gives every practice session a clear purpose. ",
 Urdu: "اردو ایک خوبصورت زبان ہے۔ روزانہ مشق کرنے سے ٹائپنگ کی رفتار اور درستگی بہتر ہوتی ہے۔ مستقل مزاجی کامیابی کی کنجی ہے۔ علم انسان کو بہتر فیصلے کرنے میں مدد دیتا ہے۔ نئی مہارت سیکھنے کے لیے صبر، توجہ اور مسلسل مشق ضروری ہے۔ ",
 Spanish: "La práctica constante ayuda a mejorar la velocidad y la precisión al escribir. Aprende poco a poco y celebra cada pequeño avance. Mantén una postura cómoda, presta atención a cada palabra y disfruta del proceso de aprendizaje. ",
 French: "La pratique régulière améliore la vitesse et la précision. Prenez votre temps, gardez une bonne posture et progressez chaque jour. Une bonne technique commence par des gestes calmes, une attention constante et des habitudes simples. "
};