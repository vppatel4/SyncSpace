import type { ActivityType, Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "./prisma.js";

/** Use `db` = transaction client when calling inside `prisma.$transaction`, or inserts can violate FKs (row not visible yet). */
export async function createActivityLog(
  input: {
    type: ActivityType;
    message: string;
    userId: string;
    taskId?: string | null;
    projectId?: string | null;
    metadata?: Prisma.InputJsonValue;
  },
  db: Prisma.TransactionClient | PrismaClient = prisma,
): Promise<void> {
  await db.activityLog.create({
    data: {
      type: input.type,
      message: input.message,
      userId: input.userId,
      taskId: input.taskId ?? undefined,
      projectId: input.projectId ?? undefined,
      metadata: input.metadata ?? undefined,
    },
  });
}
