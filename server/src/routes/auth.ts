import crypto from "crypto";
import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { signAccessToken } from "../lib/jwt.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { sendPasswordResetEmail } from "../lib/email.js";

function hashResetToken(raw: string): string {
  return crypto.createHash("sha256").update(raw, "utf8").digest("hex");
}

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(120),
  username: z
    .string()
    .min(2)
    .max(32)
    .regex(/^[a-zA-Z0-9_]+$/),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

const FORGOT_PASSWORD_MESSAGE =
  "If an account exists for that email, we've sent password reset instructions.";

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const body = registerSchema.parse(req.body);
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: body.email }, { username: body.username }] },
    });
    if (existing) {
      res.status(409).json({ error: "Conflict", message: "Email or username already in use" });
      return;
    }
    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await prisma.user.create({
      data: {
        email: body.email,
        username: body.username,
        name: body.name,
        passwordHash,
      },
      select: { id: true, email: true, name: true, username: true, image: true },
    });
    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    res.status(201).json({ user, accessToken });
  }),
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const body = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) {
      res.status(401).json({ error: "Unauthorized", message: "Invalid email or password" });
      return;
    }
    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) {
      res.status(401).json({ error: "Unauthorized", message: "Invalid email or password" });
      return;
    }
    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    res.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        image: user.image,
      },
    });
  }),
);

authRouter.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    const body = forgotPasswordSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) {
      res.json({ message: FORGOT_PASSWORD_MESSAGE });
      return;
    }

    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashResetToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const clientOrigin = (process.env.SYNCSPACE_CLIENT_ORIGIN ?? "http://localhost:3000").replace(
      /\/$/,
      "",
    );
    const resetUrl = `${clientOrigin}/reset-password?token=${encodeURIComponent(rawToken)}`;
    const { delivery } = await sendPasswordResetEmail(user.email, resetUrl);

    const emailDispatched = delivery !== "none";
    /** Local/staging: expose link in JSON when mail is not configured (never in production). */
    const showDevLink =
      process.env.NODE_ENV === "production" ? false : delivery === "none";

    res.json({
      message: FORGOT_PASSWORD_MESSAGE,
      emailDispatched,
      ...(showDevLink ? { devResetUrl: resetUrl } : {}),
    });
  }),
);

authRouter.post(
  "/reset-password",
  asyncHandler(async (req, res) => {
    const body = resetPasswordSchema.parse(req.body);
    const tokenHash = hashResetToken(body.token);
    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });
    if (!record || record.expiresAt < new Date()) {
      res.status(400).json({
        error: "BadRequest",
        message: "This reset link is invalid or has expired. Request a new one from the login page.",
      });
      return;
    }

    const passwordHash = await bcrypt.hash(body.newPassword, 12);
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.delete({ where: { id: record.id } }),
    ]);

    res.json({ message: "Password updated. You can sign in with your new password." });
  }),
);
