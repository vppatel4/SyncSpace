import jwt from "jsonwebtoken";

const secret = process.env.SYNCSPACE_JWT_SECRET ?? process.env.JWT_SECRET;

if (!secret && process.env.NODE_ENV === "production") {
  throw new Error("SYNCSPACE_JWT_SECRET is required in production");
}

const fallbackDevSecret = "syncspace-dev-only-change-in-production";

export function signAccessToken(payload: { sub: string; email: string }): string {
  const s = secret ?? fallbackDevSecret;
  const expiresIn = process.env.SYNCSPACE_JWT_EXPIRES_IN ?? "7d";
  return jwt.sign(payload, s, { expiresIn: expiresIn as jwt.SignOptions["expiresIn"] });
}

export function verifyAccessToken(token: string): { sub: string; email: string } {
  const s = secret ?? fallbackDevSecret;
  const decoded = jwt.verify(token, s) as jwt.JwtPayload & { sub: string; email: string };
  return { sub: decoded.sub, email: decoded.email };
}
