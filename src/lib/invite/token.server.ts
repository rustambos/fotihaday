// Stateless admin session tokens signed with HMAC-SHA256 (Web Crypto, works on workerd).
const enc = new TextEncoder();

function b64u(buf: ArrayBuffer): string {
  let s = "";
  for (const b of new Uint8Array(buf)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(secret: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return b64u(await crypto.subtle.sign("HMAC", key, enc.encode(msg)));
}

export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function sha256Hex(value: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", enc.encode(value));
  return Array.from(new Uint8Array(d))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const SESSION_TTL_MS = 2 * 60 * 60 * 1000;

export async function signToken(secret: string, ttlMs = SESSION_TTL_MS, now = Date.now()) {
  const payload = `admin.${now + ttlMs}`;
  return `${payload}.${await hmac(secret, payload)}`;
}

export async function verifyToken(token: string, secret: string, now = Date.now()) {
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "admin") return false;
  const exp = Number(parts[1]);
  if (!Number.isFinite(exp) || exp <= now) return false;
  const expected = await hmac(secret, `${parts[0]}.${parts[1]}`);
  return safeEqual(expected, parts[2] ?? "");
}
