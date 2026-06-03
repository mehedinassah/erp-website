import { SignJWT, jwtVerify } from "jose";

// Edge-safe session helpers (jose only — no Node APIs). Imported by both
// middleware (edge) and the server cookie helpers in auth.ts.

export const SESSION_COOKIE = "rong_session";

export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySession(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      userId: String(payload.userId),
      email: String(payload.email),
      name: String(payload.name),
      role: String(payload.role),
      tenantId: String(payload.tenantId),
    };
  } catch {
    return null;
  }
}
