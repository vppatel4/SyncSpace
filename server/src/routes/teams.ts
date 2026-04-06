import { Router } from "express";
import { z } from "zod";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { createActivityLog } from "../lib/activity.js";

export const teamsRouter = Router();
teamsRouter.use(authMiddleware);

const roleZ = z.nativeEnum(Role);

const createTeamSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional().nullable(),
});

const updateTeamSchema = createTeamSchema.partial();

const addMemberSchema = z.object({
  username: z.string().min(2).max(32),
  role: roleZ.optional(),
});

teamsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const teams = await prisma.team.findMany({
      where: { members: { some: { userId } } },
      orderBy: { updatedAt: "desc" },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true, username: true, image: true } } },
        },
      },
    });
    res.json({ teams });
  }),
);

teamsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = z.string().cuid().parse(req.params.id);
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true, username: true, image: true } } },
        },
        projectTeams: { include: { project: true } },
      },
    });
    if (!team) {
      res.status(404).json({ error: "NotFound", message: "Team not found" });
      return;
    }
    res.json({ team });
  }),
);

teamsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = createTeamSchema.parse(req.body);
    const userId = req.user!.id;
    const team = await prisma.$transaction(async (tx) => {
      const t = await tx.team.create({
        data: {
          name: body.name,
          description: body.description ?? undefined,
          members: { create: { userId, role: Role.Owner } },
        },
        include: {
          members: {
            include: { user: { select: { id: true, name: true, email: true, username: true, image: true } } },
          },
        },
      });
      await createActivityLog({
        type: "TEAM_CREATED",
        message: `Team "${t.name}" was created`,
        userId,
        metadata: { teamId: t.id },
      });
      return t;
    });
    res.status(201).json({ team });
  }),
);

teamsRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = z.string().cuid().parse(req.params.id);
    const body = updateTeamSchema.parse(req.body);
    const userId = req.user!.id;
    const membership = await prisma.teamMember.findFirst({
      where: { teamId: id, userId, role: { in: [Role.Owner, Role.Admin] } },
    });
    if (!membership) {
      res.status(403).json({ error: "Forbidden", message: "Insufficient permissions" });
      return;
    }
    const team = await prisma.team.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description === null ? null : body.description,
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true, username: true, image: true } } },
        },
      },
    });
    await createActivityLog({
      type: "TEAM_UPDATED",
      message: `Team "${team.name}" was updated`,
      userId,
      metadata: { teamId: id },
    });
    res.json({ team });
  }),
);

teamsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = z.string().cuid().parse(req.params.id);
    const userId = req.user!.id;
    const membership = await prisma.teamMember.findFirst({
      where: { teamId: id, userId, role: Role.Owner },
    });
    if (!membership) {
      res.status(403).json({ error: "Forbidden", message: "Only the owner can delete the team" });
      return;
    }
    await prisma.team.delete({ where: { id } });
    res.status(204).send();
  }),
);

teamsRouter.post(
  "/:id/members",
  asyncHandler(async (req, res) => {
    const teamId = z.string().cuid().parse(req.params.id);
    const body = addMemberSchema.parse(req.body);
    const userId = req.user!.id;

    const canManage = await prisma.teamMember.findFirst({
      where: { teamId, userId, role: { in: [Role.Owner, Role.Admin] } },
    });
    if (!canManage) {
      res.status(403).json({ error: "Forbidden", message: "Insufficient permissions" });
      return;
    }

    const invitee = await prisma.user.findUnique({ where: { username: body.username } });
    if (!invitee) {
      res.status(404).json({ error: "NotFound", message: "User not found" });
      return;
    }

    const existing = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId: invitee.id, teamId } },
    });
    if (existing) {
      res.status(409).json({ error: "Conflict", message: "User is already a member" });
      return;
    }

    const member = await prisma.teamMember.create({
      data: {
        teamId,
        userId: invitee.id,
        role: body.role ?? Role.Member,
      },
      include: { user: { select: { id: true, name: true, email: true, username: true, image: true } } },
    });

    await createActivityLog({
      type: "MEMBER_JOINED",
      message: `${invitee.name} joined the team`,
      userId: invitee.id,
      metadata: { teamId },
    });

    res.status(201).json({ member });
  }),
);

teamsRouter.delete(
  "/:id/members/:userId",
  asyncHandler(async (req, res) => {
    const teamId = z.string().cuid().parse(req.params.id);
    const targetUserId = z.string().cuid().parse(req.params.userId);
    const userId = req.user!.id;

    const canManage = await prisma.teamMember.findFirst({
      where: { teamId, userId, role: { in: [Role.Owner, Role.Admin] } },
    });
    if (!canManage && userId !== targetUserId) {
      res.status(403).json({ error: "Forbidden", message: "Insufficient permissions" });
      return;
    }

    const target = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId: targetUserId, teamId } },
    });
    if (!target) {
      res.status(404).json({ error: "NotFound", message: "Member not found" });
      return;
    }
    if (target.role === Role.Owner) {
      res.status(400).json({ error: "BadRequest", message: "Cannot remove the team owner" });
      return;
    }

    await prisma.teamMember.delete({ where: { id: target.id } });
    res.status(204).send();
  }),
);
