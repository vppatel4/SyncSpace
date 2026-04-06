import { Router } from "express";
import { TaskStatus, Priority } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const myWorkRouter = Router();
myWorkRouter.use(authMiddleware);

myWorkRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfWeek = new Date(startOfToday);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const [overdue, dueToday, dueThisWeek, recentlyCompleted, allAssigned] = await Promise.all([
      prisma.task.findMany({
        where: {
          assigneeId: userId,
          status: { not: TaskStatus.Completed },
          dueDate: { lt: startOfToday },
        },
        orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
        include: {
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true, username: true, image: true } },
          blockedBy: { select: { id: true, title: true, status: true } },
          subTasks: true,
        },
      }),
      prisma.task.findMany({
        where: {
          assigneeId: userId,
          status: { not: TaskStatus.Completed },
          dueDate: { gte: startOfToday, lt: new Date(startOfToday.getTime() + 86400000) },
        },
        orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
        include: {
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true, username: true, image: true } },
          blockedBy: { select: { id: true, title: true, status: true } },
          subTasks: true,
        },
      }),
      prisma.task.findMany({
        where: {
          assigneeId: userId,
          status: { not: TaskStatus.Completed },
          dueDate: { gte: new Date(startOfToday.getTime() + 86400000), lt: endOfWeek },
        },
        orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
        include: {
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true, username: true, image: true } },
          blockedBy: { select: { id: true, title: true, status: true } },
          subTasks: true,
        },
      }),
      prisma.task.findMany({
        where: {
          assigneeId: userId,
          status: TaskStatus.Completed,
          updatedAt: { gte: new Date(now.getTime() - 14 * 86400000) },
        },
        orderBy: { updatedAt: "desc" },
        take: 20,
        include: {
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true, username: true, image: true } },
          subTasks: true,
        },
      }),
      prisma.task.findMany({
        where: { assigneeId: userId, status: { not: TaskStatus.Completed } },
        orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
        include: {
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true, username: true, image: true } },
          blockedBy: { select: { id: true, title: true, status: true } },
          subTasks: true,
        },
      }),
    ]);

    const priorityBuckets = {
      [Priority.Urgent]: allAssigned.filter((t) => t.priority === Priority.Urgent),
      [Priority.High]: allAssigned.filter((t) => t.priority === Priority.High),
      [Priority.Medium]: allAssigned.filter((t) => t.priority === Priority.Medium),
      [Priority.Low]: allAssigned.filter((t) => t.priority === Priority.Low),
    };

    res.json({
      overdue,
      dueToday,
      dueThisWeek,
      recentlyCompleted,
      priorityBuckets,
    });
  }),
);
