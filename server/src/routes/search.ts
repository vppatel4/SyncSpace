import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const searchRouter = Router();
searchRouter.use(authMiddleware);

searchRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const q = z
      .object({
        q: z.string().min(1).max(200),
      })
      .parse(req.query);

    const userId = req.user!.id;
    const term = q.q.trim();

    const accessibleProjectIds = await prisma.project.findMany({
      where: {
        OR: [
          { creatorId: userId },
          { projectTeams: { some: { team: { members: { some: { userId } } } } } },
          { tasks: { some: { OR: [{ assigneeId: userId }, { creatorId: userId }] } } },
        ],
      },
      select: { id: true },
    });
    const ids = accessibleProjectIds.map((p) => p.id);

    if (ids.length === 0) {
      res.json({ projects: [], tasks: [], query: term });
      return;
    }

    const [projects, tasks] = await Promise.all([
      prisma.project.findMany({
        where: {
          id: { in: ids },
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { description: { contains: term, mode: "insensitive" } },
          ],
        },
        take: 15,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          status: true,
          priority: true,
          updatedAt: true,
        },
      }),
      prisma.task.findMany({
        where: {
          projectId: { in: ids },
          title: { contains: term, mode: "insensitive" },
        },
        take: 25,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          projectId: true,
          project: { select: { id: true, name: true } },
        },
      }),
    ]);

    res.json({ projects, tasks, query: term });
  }),
);
