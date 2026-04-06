import { Router } from "express";
import { z } from "zod";
import { Priority, TaskStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { createActivityLog } from "../lib/activity.js";

export const tasksRouter = Router();
tasksRouter.use(authMiddleware);

const priorityZ = z.nativeEnum(Priority);
const statusZ = z.nativeEnum(TaskStatus);

const subTaskInput = z.object({
  id: z.string().cuid().optional(),
  title: z.string().min(1).max(500),
  completed: z.boolean().optional(),
  position: z.number().int().optional(),
});

const createTaskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(20000).optional().nullable(),
  priority: priorityZ,
  status: statusZ.optional(),
  dueDate: z.string().datetime().optional().nullable(),
  projectId: z.string().cuid(),
  assigneeId: z.string().cuid().optional().nullable(),
  blockedById: z.string().cuid().optional().nullable(),
  position: z.number().int().optional(),
  subTasks: z.array(subTaskInput).optional(),
});

const updateTaskSchema = createTaskSchema.partial().extend({
  title: z.string().min(1).max(500).optional(),
});

const taskInclude = {
  assignee: { select: { id: true, name: true, email: true, username: true, image: true } },
  creator: { select: { id: true, name: true, email: true, username: true, image: true } },
  blockedBy: { select: { id: true, title: true, status: true, priority: true } },
  subTasks: { orderBy: { position: "asc" as const } },
  comments: {
    orderBy: { createdAt: "desc" as const },
    include: { user: { select: { id: true, name: true, username: true, image: true } } },
  },
  attachments: true,
  project: { select: { id: true, name: true } },
} as const;

tasksRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const q = z
      .object({
        projectId: z.string().cuid().optional(),
        priority: priorityZ.optional(),
        status: statusZ.optional(),
      })
      .parse(req.query);

    const userId = req.user!.id;
    const where = {
      AND: [
        q.projectId ? { projectId: q.projectId } : {},
        q.priority ? { priority: q.priority } : {},
        q.status ? { status: q.status } : {},
        {
          OR: [
            { assigneeId: userId },
            { creatorId: userId },
            {
              project: {
                projectTeams: {
                  some: { team: { members: { some: { userId } } } },
                },
              },
            },
          ],
        },
      ],
    };

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ projectId: "asc" }, { status: "asc" }, { position: "asc" }],
      include: taskInclude,
    });
    res.json({ tasks });
  }),
);

tasksRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = z.string().cuid().parse(req.params.id);
    const task = await prisma.task.findUnique({
      where: { id },
      include: taskInclude,
    });
    if (!task) {
      res.status(404).json({ error: "NotFound", message: "Task not found" });
      return;
    }
    res.json({ task });
  }),
);

tasksRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = createTaskSchema.parse(req.body);
    const userId = req.user!.id;
    const maxPos = await prisma.task.aggregate({
      where: { projectId: body.projectId, status: body.status ?? TaskStatus.ToDo },
      _max: { position: true },
    });
    const position = body.position ?? (maxPos._max.position ?? -1) + 1;

    const task = await prisma.$transaction(async (tx) => {
      const t = await tx.task.create({
        data: {
          title: body.title,
          description: body.description ?? undefined,
          priority: body.priority,
          status: body.status ?? TaskStatus.ToDo,
          dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
          projectId: body.projectId,
          assigneeId: body.assigneeId ?? undefined,
          creatorId: userId,
          blockedById: body.blockedById ?? undefined,
          position,
          subTasks: body.subTasks?.length
            ? {
                create: body.subTasks.map((s, i) => ({
                  title: s.title,
                  completed: s.completed ?? false,
                  position: s.position ?? i,
                })),
              }
            : undefined,
        },
        include: taskInclude,
      });
      await createActivityLog(
        {
          type: "TASK_CREATED",
          message: `Task "${t.title}" was created`,
          userId,
          taskId: t.id,
          projectId: t.projectId,
          metadata: { taskId: t.id, projectId: t.projectId },
        },
        tx,
      );
      return t;
    });

    res.status(201).json({ task });
  }),
);

tasksRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = z.string().cuid().parse(req.params.id);
    const body = updateTaskSchema.parse(req.body);
    const userId = req.user!.id;

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "NotFound", message: "Task not found" });
      return;
    }

    const prevStatus = existing.status;

    const task = await prisma.$transaction(async (tx) => {
      const t = await tx.task.update({
        where: { id },
        data: {
          title: body.title,
          description: body.description === null ? null : body.description,
          priority: body.priority,
          status: body.status,
          dueDate: body.dueDate === undefined ? undefined : body.dueDate ? new Date(body.dueDate) : null,
          projectId: body.projectId,
          assigneeId: body.assigneeId === undefined ? undefined : body.assigneeId,
          blockedById: body.blockedById === undefined ? undefined : body.blockedById,
          position: body.position,
        },
        include: taskInclude,
      });

      if (body.subTasks) {
        await tx.subTask.deleteMany({ where: { taskId: id } });
        if (body.subTasks.length) {
          await tx.subTask.createMany({
            data: body.subTasks.map((s, i) => ({
              taskId: id,
              title: s.title,
              completed: s.completed ?? false,
              position: s.position ?? i,
            })),
          });
        }
      }

      if (body.status && body.status !== prevStatus) {
        if (body.status === TaskStatus.Completed) {
          await createActivityLog(
            {
              type: "TASK_COMPLETED",
              message: `Task "${t.title}" was completed`,
              userId,
              taskId: id,
              projectId: t.projectId,
            },
            tx,
          );
        } else {
          await createActivityLog(
            {
              type: "TASK_MOVED",
              message: `Task "${t.title}" moved from ${prevStatus} to ${body.status}`,
              userId,
              taskId: id,
              projectId: t.projectId,
              metadata: { from: prevStatus, to: body.status },
            },
            tx,
          );
        }
      } else if (
        body.title !== undefined ||
        body.description !== undefined ||
        body.priority !== undefined ||
        body.dueDate !== undefined ||
        body.assigneeId !== undefined ||
        body.blockedById !== undefined ||
        body.subTasks !== undefined
      ) {
        await createActivityLog(
          {
            type: "TASK_UPDATED",
            message: `Task "${t.title}" was updated`,
            userId,
            taskId: id,
            projectId: t.projectId,
          },
          tx,
        );
      }

      return tx.task.findUniqueOrThrow({
        where: { id },
        include: taskInclude,
      });
    });

    res.json({ task });
  }),
);

tasksRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = z.string().cuid().parse(req.params.id);
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "NotFound", message: "Task not found" });
      return;
    }
    await prisma.task.delete({ where: { id } });
    res.status(204).send();
  }),
);

const commentSchema = z.object({
  content: z.string().min(1).max(10000),
});

tasksRouter.post(
  "/:id/comments",
  asyncHandler(async (req, res) => {
    const taskId = z.string().cuid().parse(req.params.id);
    const body = commentSchema.parse(req.body);
    const userId = req.user!.id;
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      res.status(404).json({ error: "NotFound", message: "Task not found" });
      return;
    }
    const comment = await prisma.comment.create({
      data: { content: body.content, userId, taskId },
      include: { user: { select: { id: true, name: true, username: true, image: true } } },
    });
    await createActivityLog({
      type: "COMMENT_ADDED",
      message: `Comment added on "${task.title}"`,
      userId,
      taskId,
      projectId: task.projectId,
    });
    res.status(201).json({ comment });
  }),
);

const attachmentSchema = z.object({
  filename: z.string().min(1).max(500),
  url: z.string().url().max(2000),
  mimeType: z.string().max(200).optional().nullable(),
  size: z.number().int().positive().optional().nullable(),
});

tasksRouter.post(
  "/:id/attachments",
  asyncHandler(async (req, res) => {
    const taskId = z.string().cuid().parse(req.params.id);
    const body = attachmentSchema.parse(req.body);
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      res.status(404).json({ error: "NotFound", message: "Task not found" });
      return;
    }
    const attachment = await prisma.attachment.create({
      data: {
        filename: body.filename,
        url: body.url,
        mimeType: body.mimeType ?? undefined,
        size: body.size ?? undefined,
        taskId,
      },
    });
    res.status(201).json({ attachment });
  }),
);
