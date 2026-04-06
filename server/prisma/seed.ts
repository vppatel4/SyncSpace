import { PrismaClient, ProjectStatus, Priority, TaskStatus, Role, ActivityType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await prisma.activityLog.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.subTask.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectTeam.deleteMany();
  await prisma.project.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("SyncSpaceDemo1!", 12);

  const vidhi = await prisma.user.create({
    data: {
      email: "vidhi@syncspace.dev",
      username: "vidhipatel",
      name: "Vidhi Patel",
      passwordHash,
    },
  });

  const alex = await prisma.user.create({
    data: {
      email: "alex@syncspace.dev",
      username: "alexrivera",
      name: "Alex Rivera",
      passwordHash,
    },
  });

  const eng = await prisma.team.create({
    data: {
      name: "SyncSpace Engineering",
      description: "Core platform, APIs, and infrastructure.",
      members: {
        create: [
          { userId: vidhi.id, role: Role.Owner },
          { userId: alex.id, role: Role.Member },
        ],
      },
    },
  });

  const product = await prisma.team.create({
    data: {
      name: "Product & Experience",
      description: "Design, research, and roadmap.",
      members: {
        create: [{ userId: vidhi.id, role: Role.Owner }],
      },
    },
  });

  const p1 = await prisma.project.create({
    data: {
      name: "SyncSpace Platform Launch",
      description: "Ship the v1 workspace with Kanban, My Work, and Task Pulse.",
      status: ProjectStatus.Active,
      priority: Priority.Urgent,
      creatorId: vidhi.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 86400000),
      projectTeams: {
        create: [{ teamId: eng.id }, { teamId: product.id }],
      },
    },
  });

  const p2 = await prisma.project.create({
    data: {
      name: "Mobile App Redesign",
      description: "Refresh navigation, typography, and dark mode polish.",
      status: ProjectStatus.Active,
      priority: Priority.High,
      creatorId: alex.id,
      projectTeams: {
        create: [{ teamId: product.id }],
      },
    },
  });

  const p3 = await prisma.project.create({
    data: {
      name: "Customer Success Playbook",
      description: "Templates and workflows for onboarding new teams to SyncSpace.",
      status: ProjectStatus.Planning,
      priority: Priority.Medium,
      creatorId: vidhi.id,
      projectTeams: {
        create: [{ teamId: eng.id }],
      },
    },
  });

  const tAuth = await prisma.task.create({
    data: {
      title: "Wire NextAuth credentials + JWT handoff",
      description: "Connect the Next.js client to Express with bearer tokens.",
      priority: Priority.Urgent,
      status: TaskStatus.Completed,
      position: 0,
      projectId: p1.id,
      creatorId: vidhi.id,
      assigneeId: vidhi.id,
      dueDate: new Date(Date.now() - 2 * 86400000),
      subTasks: {
        create: [
          { title: "Add session provider", completed: true, position: 0 },
          { title: "RTK Query auth headers", completed: true, position: 1 },
        ],
      },
    },
  });

  const tPrisma = await prisma.task.create({
    data: {
      title: "Finalize Prisma schema & seed data",
      description: "Models for teams, tasks, dependencies, and activity logs.",
      priority: Priority.High,
      status: TaskStatus.WorkInProgress,
      position: 0,
      projectId: p1.id,
      creatorId: vidhi.id,
      assigneeId: alex.id,
      dueDate: new Date(Date.now() + 1 * 86400000),
      subTasks: {
        create: [
          { title: "Review relations", completed: true, position: 0 },
          { title: "Seed demo users", completed: false, position: 1 },
        ],
      },
    },
  });

  const tKanban = await prisma.task.create({
    data: {
      title: "Kanban drag-and-drop polish",
      description: "Framer Motion lift states + optimistic updates.",
      priority: Priority.High,
      status: TaskStatus.UnderReview,
      position: 0,
      projectId: p1.id,
      creatorId: alex.id,
      assigneeId: vidhi.id,
      dueDate: new Date(Date.now() + 3 * 86400000),
    },
  });

  await prisma.task.create({
    data: {
      title: "Dashboard analytics & heatmap",
      description: "Recharts burndown + GitHub-style workload heatmap.",
      priority: Priority.Medium,
      status: TaskStatus.ToDo,
      position: 1,
      projectId: p1.id,
      creatorId: vidhi.id,
      assigneeId: vidhi.id,
      blockedById: tPrisma.id,
      dueDate: new Date(Date.now() + 7 * 86400000),
    },
  });

  await prisma.task.create({
    data: {
      title: "Task Pulse feed — 30s refresh",
      description: "Activity feed with avatars and timestamps.",
      priority: Priority.Medium,
      status: TaskStatus.ToDo,
      position: 2,
      projectId: p1.id,
      creatorId: alex.id,
      assigneeId: alex.id,
      dueDate: new Date(Date.now() + 5 * 86400000),
    },
  });

  await prisma.task.create({
    data: {
      title: "Command palette (Ctrl+K)",
      description: "cmdk palette for navigation and quick task jump.",
      priority: Priority.Low,
      status: TaskStatus.ToDo,
      position: 3,
      projectId: p1.id,
      creatorId: vidhi.id,
      assigneeId: alex.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "Design system tokens audit",
      description: "Align indigo accent + slate surfaces across light/dark.",
      priority: Priority.Urgent,
      status: TaskStatus.WorkInProgress,
      position: 0,
      projectId: p2.id,
      creatorId: alex.id,
      assigneeId: vidhi.id,
      dueDate: new Date(),
    },
  });

  await prisma.task.create({
    data: {
      title: "Mobile bottom navigation",
      description: "Collapse sidebar into thumb-friendly nav.",
      priority: Priority.High,
      status: TaskStatus.UnderReview,
      position: 1,
      projectId: p2.id,
      creatorId: vidhi.id,
      assigneeId: alex.id,
      dueDate: new Date(Date.now() + 2 * 86400000),
    },
  });

  await prisma.task.create({
    data: {
      title: "Empty state illustrations",
      description: "Unique SVGs per surface with CTA.",
      priority: Priority.Medium,
      status: TaskStatus.ToDo,
      position: 2,
      projectId: p2.id,
      creatorId: alex.id,
      assigneeId: alex.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "Onboarding checklist template",
      description: "Default tasks for new workspaces.",
      priority: Priority.Medium,
      status: TaskStatus.ToDo,
      position: 0,
      projectId: p3.id,
      creatorId: vidhi.id,
      assigneeId: vidhi.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "CS playbook — escalation paths",
      description: "When to loop engineering vs success.",
      priority: Priority.Low,
      status: TaskStatus.ToDo,
      position: 1,
      projectId: p3.id,
      creatorId: vidhi.id,
      assigneeId: alex.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: "Love the dependency lock icons on cards — super clear.",
      userId: alex.id,
      taskId: tKanban.id,
    },
  });

  await prisma.attachment.create({
    data: {
      filename: "syncspace-architecture.png",
      url: "https://placehold.co/1200x600/4F46E5/ffffff?text=SyncSpace",
      mimeType: "image/png",
      size: 240000,
      taskId: tAuth.id,
    },
  });

  const logs: { type: ActivityType; message: string; userId: string; taskId?: string; projectId?: string }[] = [
    { type: "PROJECT_CREATED", message: `Project "${p1.name}" was created`, userId: vidhi.id, projectId: p1.id },
    { type: "PROJECT_CREATED", message: `Project "${p2.name}" was created`, userId: alex.id, projectId: p2.id },
    { type: "TEAM_CREATED", message: `Team "${eng.name}" was created`, userId: vidhi.id },
    { type: "TASK_CREATED", message: `Task "${tAuth.title}" was created`, userId: vidhi.id, taskId: tAuth.id, projectId: p1.id },
    { type: "TASK_COMPLETED", message: `Task "${tAuth.title}" was completed`, userId: vidhi.id, taskId: tAuth.id, projectId: p1.id },
    { type: "COMMENT_ADDED", message: `Comment added on "${tKanban.title}"`, userId: alex.id, taskId: tKanban.id, projectId: p1.id },
    { type: "TASK_MOVED", message: `Task "${tKanban.title}" moved to UnderReview`, userId: alex.id, taskId: tKanban.id, projectId: p1.id },
  ];

  for (const l of logs) {
    await prisma.activityLog.create({ data: l });
  }

  console.log("Seed complete: Vidhi + Alex, teams, projects, tasks, activity.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
