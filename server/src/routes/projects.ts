import { Router } from "express";
import { z } from "zod";
import { ProjectStatus, Priority } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { createActivityLog } from "../lib/activity.js";

export const projectsRouter = Router();

const projectStatusZ = z.nativeEnum(ProjectStatus);
const priorityZ = z.nativeEnum(Priority);

const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  status: projectStatusZ.optional(),
  priority: priorityZ.optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  teamIds: z.array(z.string().cuid()).optional(),
});

const updateProjectSchema = createProjectSchema.partial();

projectsRouter.use(authMiddleware);

projectsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { creatorId: userId },
          {
            projectTeams: {
              some: {
                team: {
                  members: { some: { userId } },
                },
              },
            },
          },
          {
            tasks: { some: { OR: [{ assigneeId: userId }, { creatorId: userId }] } },
          },
        ],
      },
      orderBy: { updatedAt: "desc" },
      include: {
        creator: { select: { id: true, name: true, username: true, image: true } },
        projectTeams: { include: { team: true } },
        _count: { select: { tasks: true } },
      },
    });
    res.json({ projects });
  }),
);

projectsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = z.string().cuid().parse(req.params.id);
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, username: true, image: true } },
        projectTeams: { include: { team: { include: { members: { include: { user: true } } } } } },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true, username: true, image: true } },
            subTasks: true,
            blockedBy: { select: { id: true, title: true, status: true } },
          },
          orderBy: [{ status: "asc" }, { position: "asc" }],
        },
      },
    });
    if (!project) {
      res.status(404).json({ error: "NotFound", message: "Project not found" });
      return;
    }
    res.json({ project });
  }),
);

projectsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = createProjectSchema.parse(req.body);
    const userId = req.user!.id;
    const project = await prisma.$transaction(async (tx) => {
      const p = await tx.project.create({
        data: {
          name: body.name,
          description: body.description ?? undefined,
          status: body.status ?? ProjectStatus.Planning,
          priority: body.priority ?? Priority.Medium,
          startDate: body.startDate ? new Date(body.startDate) : undefined,
          endDate: body.endDate ? new Date(body.endDate) : undefined,
          creatorId: userId,
        },
      });
      if (body.teamIds?.length) {
        await tx.projectTeam.createMany({
          data: body.teamIds.map((teamId) => ({ projectId: p.id, teamId })),
          skipDuplicates: true,
        });
      }
      await createActivityLog(
        {
          type: "PROJECT_CREATED",
          message: `Project "${p.name}" was created`,
          userId,
          projectId: p.id,
          metadata: { projectId: p.id },
        },
        tx,
      );
      return p;
    });
    const full = await prisma.project.findUnique({
      where: { id: project.id },
      include: { projectTeams: { include: { team: true } }, _count: { select: { tasks: true } } },
    });
    res.status(201).json({ project: full });
  }),
);

projectsRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = z.string().cuid().parse(req.params.id);
    const body = updateProjectSchema.parse(req.body);
    const userId = req.user!.id;
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "NotFound", message: "Project not found" });
      return;
    }
    const project = await prisma.project.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description === null ? null : body.description,
        status: body.status,
        priority: body.priority,
        startDate: body.startDate === undefined ? undefined : body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate === undefined ? undefined : body.endDate ? new Date(body.endDate) : null,
      },
      include: { projectTeams: { include: { team: true } }, _count: { select: { tasks: true } } },
    });
    if (body.teamIds) {
      await prisma.projectTeam.deleteMany({ where: { projectId: id } });
      if (body.teamIds.length) {
        await prisma.projectTeam.createMany({
          data: body.teamIds.map((teamId) => ({ projectId: id, teamId })),
        });
      }
    }
    await createActivityLog({
      type: "PROJECT_UPDATED",
      message: `Project "${project.name}" was updated`,
      userId,
      projectId: id,
    });
    res.json({ project });
  }),
);

projectsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = z.string().cuid().parse(req.params.id);
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "NotFound", message: "Project not found" });
      return;
    }
    await prisma.project.delete({ where: { id } });
    res.status(204).send();
  }),
);
