import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { authRouter } from "./routes/auth.js";
import { projectsRouter } from "./routes/projects.js";
import { tasksRouter } from "./routes/tasks.js";
import { teamsRouter } from "./routes/teams.js";
import { usersRouter } from "./routes/users.js";
import { searchRouter } from "./routes/search.js";
import { activityRouter } from "./routes/activity.js";
import { myWorkRouter } from "./routes/my-work.js";
import { analyticsRouter } from "./routes/analytics.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
const port = Number(process.env.SYNCSPACE_PORT ?? process.env.PORT ?? 4000);
const clientOrigin = process.env.SYNCSPACE_CLIENT_ORIGIN ?? "http://localhost:3000";

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  }),
);
app.use(morgan("dev"));
app.use(express.json({ limit: "2mb" }));

app.use((req, res, next) => {
  res.setHeader("X-App-Name", "SyncSpace");
  next();
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, app: "SyncSpace" });
});

/** Root URL — browsers opening http://localhost:4000/ should see this, not a 404 */
app.get("/", (_req, res) => {
  res.json({
    app: "SyncSpace API",
    message: "This is the REST backend. The web UI runs on the Next.js dev server (usually http://localhost:3000).",
    endpoints: {
      health: "GET /health",
      auth: "POST /auth/login, POST /auth/register, POST /auth/forgot-password, POST /auth/reset-password",
      api: "GET /api/projects, /api/tasks, …",
    },
  });
});

app.use("/auth", authRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/teams", teamsRouter);
app.use("/api/users", usersRouter);
app.use("/api/search", searchRouter);
app.use("/api/activity", activityRouter);
app.use("/api/my-work", myWorkRouter);
app.use("/api/analytics", analyticsRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "NotFound", message: "Route not found" });
});

app.use(errorHandler);

app.listen(port, () => {
  console.log(`SyncSpace API listening on http://localhost:${port}`);
});
