import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const usersRouter = Router();
usersRouter.use(authMiddleware);

/** List all accounts (for directory / headcount). Must be registered before `/:id`. */
usersRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        image: true,
        createdAt: true,
      },
    });
    res.json({ users, total: users.length });
  }),
);

const updateUserSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  email: z.string().email().optional(),
  image: z.string().url().max(2000).optional().nullable(),
  currentPassword: z.string().min(1).optional(),
  newPassword: z.string().min(8).optional(),
});

usersRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = z.string().cuid().parse(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        image: true,
        createdAt: true,
      },
    });
    if (!user) {
      res.status(404).json({ error: "NotFound", message: "User not found" });
      return;
    }
    res.json({ user });
  }),
);

usersRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = z.string().cuid().parse(req.params.id);
    const body = updateUserSchema.parse(req.body);
    const requesterId = req.user!.id;

    if (id !== requesterId) {
      res.status(403).json({ error: "Forbidden", message: "You can only update your own profile" });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "NotFound", message: "User not found" });
      return;
    }

    if (body.email && body.email !== existing.email) {
      const taken = await prisma.user.findUnique({ where: { email: body.email } });
      if (taken) {
        res.status(409).json({ error: "Conflict", message: "Email already in use" });
        return;
      }
    }

    if (body.newPassword) {
      if (!body.currentPassword) {
        res.status(400).json({ error: "BadRequest", message: "Current password required to set new password" });
        return;
      }
      const ok = await bcrypt.compare(body.currentPassword, existing.passwordHash);
      if (!ok) {
        res.status(401).json({ error: "Unauthorized", message: "Current password is incorrect" });
        return;
      }
    }

    const passwordHash = body.newPassword ? await bcrypt.hash(body.newPassword, 12) : undefined;

    const user = await prisma.user.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email,
        image: body.image === null ? null : body.image,
        ...(passwordHash ? { passwordHash } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        image: true,
        createdAt: true,
      },
    });

    res.json({ user });
  }),
);
