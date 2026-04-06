import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const activityRouter = Router();
activityRouter.use(authMiddleware);

activityRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const query = z
      .object({
        limit: z.coerce.number().int().min(1).max(100).optional(),
      })
      .parse(req.query);

    const limit = query.limit ?? 40;

    const accessibleProjectIds = await prisma.project.findMany({
      where: {
        OR: [
          { creatorId: userId },
          { projectTeams: { some: { team: { members: { some: { userId } } } } } },
        ],
      },
      select: { id: true },
    });
    const projectIds = accessibleProjectIds.map((p) => p.id);

    const items = await prisma.activityLog.findMany({
      where: {
        OR: [
          { projectId: { in: projectIds } },
          {
            task: {
              projectId: { in: projectIds },
            },
          },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: { select: { id: true, name: true, username: true, image: true } },
        task: { select: { id: true, title: true, status: true } },
        project: { select: { id: true, name: true } },
      },
    });

    res.json({ items });
  }),
);
