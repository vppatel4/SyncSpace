import { Router } from "express";
import { z } from "zod";
import { Priority, TaskStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const analyticsRouter = Router();
analyticsRouter.use(authMiddleware);

function weekStartMonday(d: Date): string {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = x.getUTCDay();
  const diff = (day + 6) % 7;
  x.setUTCDate(x.getUTCDate() - diff);
  return x.toISOString().slice(0, 10);
}

/** GitHub-style workload heatmap: load score per assignee per day */
analyticsRouter.get(
  "/workload-heatmap",
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const query = z
      .object({
        days: z.coerce.number().int().min(7).max(365).optional(),
      })
      .parse(req.query);

    const days = query.days ?? 84;
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - (days - 1));
    const startKey = start.toISOString().slice(0, 10);

    const teamPeers = await prisma.teamMember.findMany({
      where: { team: { members: { some: { userId } } } },
      select: { userId: true },
    });
    const memberIds = [...new Set([userId, ...teamPeers.map((m) => m.userId)])];

    const tasks = await prisma.task.findMany({
      where: {
        assigneeId: { in: memberIds },
      },
      select: {
        assigneeId: true,
        dueDate: true,
        updatedAt: true,
        status: true,
      },
    });

    type Cell = { date: string; userId: string; count: number };
    const cells: Cell[] = [];
    const map = new Map<string, number>();

    const bump = (day: string, uid: string, weight: number) => {
      if (day < startKey) return;
      const k = `${day}|${uid}`;
      map.set(k, (map.get(k) ?? 0) + weight);
    };

    for (const t of tasks) {
      if (!t.assigneeId) continue;
      const ref = t.dueDate ?? t.updatedAt;
      const day = ref.toISOString().slice(0, 10);
      const weight = t.status === TaskStatus.Completed ? 0.35 : 1;
      bump(day, t.assigneeId, weight);
    }

    for (const [k, count] of map.entries()) {
      const [date, uid] = k.split("|");
      cells.push({ date, userId: uid, count: Math.round(count * 10) / 10 });
    }

    const users = await prisma.user.findMany({
      where: { id: { in: memberIds } },
      select: { id: true, name: true, username: true, image: true },
    });

    res.json({ start: startKey, days, cells, users });
  }),
);

/** Weekly completed counts for Urgent vs High priority tasks */
analyticsRouter.get(
  "/priority-burndown",
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const query = z
      .object({
        projectId: z.string().cuid().optional(),
        weeks: z.coerce.number().int().min(4).max(52).optional(),
      })
      .parse(req.query);

    const weeks = query.weeks ?? 12;
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - weeks * 7);

    const projectWhere = query.projectId
      ? { id: query.projectId }
      : {
          OR: [
            { creatorId: userId },
            { projectTeams: { some: { team: { members: { some: { userId } } } } } },
          ],
        };

    const completed = await prisma.task.findMany({
      where: {
        status: TaskStatus.Completed,
        priority: { in: [Priority.Urgent, Priority.High] },
        updatedAt: { gte: start },
        project: projectWhere,
      },
      select: { updatedAt: true, priority: true },
    });

    const urgentByWeek = new Map<string, number>();
    const highByWeek = new Map<string, number>();

    for (const row of completed) {
      const w = weekStartMonday(row.updatedAt);
      if (row.priority === Priority.Urgent) {
        urgentByWeek.set(w, (urgentByWeek.get(w) ?? 0) + 1);
      } else {
        highByWeek.set(w, (highByWeek.get(w) ?? 0) + 1);
      }
    }

    const allWeeks = new Set<string>([...urgentByWeek.keys(), ...highByWeek.keys()]);
    const sorted = [...allWeeks].sort();
    const series = sorted.map((week) => ({
      week,
      urgent: urgentByWeek.get(week) ?? 0,
      high: highByWeek.get(week) ?? 0,
    }));

    res.json({ series });
  }),
);
