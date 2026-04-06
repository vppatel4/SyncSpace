import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getSession } from "next-auth/react";
import type {
  ActivityItem,
  HeatmapResponse,
  MyWorkResponse,
  ProjectDetail,
  ProjectSummary,
  BurndownResponse,
  SearchResponse,
  TaskDetail,
  TeamDetail,
  TeamSummary,
  UserPublic,
} from "@/types/api";

async function authHeaders(headers: Headers): Promise<Headers> {
  const session = await getSession();
  const token = session?.accessToken;
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  headers.set("X-App-Name", "SyncSpace");
  return headers;
}

const baseUrl = process.env.NEXT_PUBLIC_SYNCSPACE_API_URL ?? "http://localhost:4000";

export const syncspaceApi = createApi({
  reducerPath: "syncspaceApi",
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: authHeaders,
  }),
  tagTypes: ["Project", "Task", "Team", "Activity", "User", "MyWork", "Analytics"],
  endpoints: (builder) => ({
    getProjects: builder.query<{ projects: ProjectSummary[] }, void>({
      query: () => "/api/projects",
      providesTags: (res) =>
        res?.projects
          ? [...res.projects.map((p) => ({ type: "Project" as const, id: p.id })), "Project"]
          : ["Project"],
    }),
    getProject: builder.query<{ project: ProjectDetail }, string>({
      query: (id) => `/api/projects/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Project", id }],
    }),
    createProject: builder.mutation<
      { project: ProjectSummary },
      {
        name: string;
        description?: string | null;
        status?: string;
        priority?: string;
        teamIds?: string[];
      }
    >({
      query: (body) => ({ url: "/api/projects", method: "POST", body }),
      invalidatesTags: ["Project", "Activity"],
    }),
    updateProject: builder.mutation<
      { project: ProjectSummary },
      { id: string; body: Record<string, unknown> }
    >({
      query: ({ id, body }) => ({ url: `/api/projects/${id}`, method: "PUT", body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Project", id }, "Project", "Activity"],
    }),
    deleteProject: builder.mutation<void, string>({
      query: (id) => ({ url: `/api/projects/${id}`, method: "DELETE" }),
      invalidatesTags: ["Project", "Activity"],
    }),

    getTasks: builder.query<
      { tasks: TaskDetail[] },
      { projectId?: string; priority?: string; status?: string } | void
    >({
      query: (params) => {
        const sp = new URLSearchParams();
        if (params?.projectId) sp.set("projectId", params.projectId);
        if (params?.priority) sp.set("priority", params.priority);
        if (params?.status) sp.set("status", params.status);
        const q = sp.toString();
        return q ? `/api/tasks?${q}` : "/api/tasks";
      },
      providesTags: (res) =>
        res?.tasks
          ? [...res.tasks.map((t) => ({ type: "Task" as const, id: t.id })), "Task"]
          : ["Task"],
    }),
    getTask: builder.query<{ task: TaskDetail }, string>({
      query: (id) => `/api/tasks/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Task", id }],
    }),
    createTask: builder.mutation<{ task: TaskDetail }, Record<string, unknown>>({
      query: (body) => ({ url: "/api/tasks", method: "POST", body }),
      invalidatesTags: ["Task", "Project", "Activity", "MyWork", "Analytics"],
    }),
    updateTask: builder.mutation<{ task: TaskDetail }, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/api/tasks/${id}`, method: "PUT", body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Task", id }, "Task", "Project", "Activity", "MyWork", "Analytics"],
    }),
    deleteTask: builder.mutation<void, string>({
      query: (id) => ({ url: `/api/tasks/${id}`, method: "DELETE" }),
      invalidatesTags: ["Task", "Project", "Activity", "MyWork", "Analytics"],
    }),
    addComment: builder.mutation<
      { comment: unknown },
      { taskId: string; content: string }
    >({
      query: ({ taskId, content }) => ({
        url: `/api/tasks/${taskId}/comments`,
        method: "POST",
        body: { content },
      }),
      invalidatesTags: (_r, _e, { taskId }) => [{ type: "Task", id: taskId }, "Activity"],
    }),

    getTeams: builder.query<{ teams: TeamSummary[] }, void>({
      query: () => "/api/teams",
      providesTags: ["Team"],
    }),
    getTeam: builder.query<{ team: TeamDetail }, string>({
      query: (id) => `/api/teams/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Team", id }],
    }),
    createTeam: builder.mutation<{ team: TeamSummary }, { name: string; description?: string | null }>({
      query: (body) => ({ url: "/api/teams", method: "POST", body }),
      invalidatesTags: ["Team", "Activity"],
    }),
    updateTeam: builder.mutation<{ team: TeamSummary }, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/api/teams/${id}`, method: "PUT", body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Team", id }, "Team"],
    }),
    deleteTeam: builder.mutation<void, string>({
      query: (id) => ({ url: `/api/teams/${id}`, method: "DELETE" }),
      invalidatesTags: ["Team"],
    }),
    addTeamMember: builder.mutation<
      { member: unknown },
      { teamId: string; username: string; role?: string }
    >({
      query: ({ teamId, username, role }) => ({
        url: `/api/teams/${teamId}/members`,
        method: "POST",
        body: { username, role },
      }),
      invalidatesTags: (_r, _e, { teamId }) => [{ type: "Team", id: teamId }, "Team", "Activity"],
    }),
    removeTeamMember: builder.mutation<void, { teamId: string; userId: string }>({
      query: ({ teamId, userId }) => ({
        url: `/api/teams/${teamId}/members/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, { teamId }) => [{ type: "Team", id: teamId }, "Team"],
    }),

    getUsers: builder.query<{ users: UserPublic[]; total: number }, void>({
      query: () => "/api/users",
      providesTags: ["User"],
    }),
    getUser: builder.query<{ user: UserPublic }, string>({
      query: (id) => `/api/users/${id}`,
      providesTags: (_r, _e, id) => [{ type: "User", id }],
    }),
    updateUser: builder.mutation<{ user: UserPublic }, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/api/users/${id}`, method: "PUT", body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "User", id }, "User"],
    }),

    search: builder.query<SearchResponse, string>({
      query: (q) => `/api/search?q=${encodeURIComponent(q)}`,
    }),

    getActivity: builder.query<{ items: ActivityItem[] }, number | void>({
      query: (limit) => (limit ? `/api/activity?limit=${limit}` : "/api/activity"),
      providesTags: ["Activity"],
    }),

    getMyWork: builder.query<MyWorkResponse, void>({
      query: () => "/api/my-work",
      providesTags: ["MyWork", "Task"],
    }),

    getWorkloadHeatmap: builder.query<HeatmapResponse, number | void>({
      query: (days) => (days ? `/api/analytics/workload-heatmap?days=${days}` : "/api/analytics/workload-heatmap"),
      providesTags: ["Analytics"],
    }),

    getPriorityBurndown: builder.query<BurndownResponse, { projectId?: string; weeks?: number } | void>({
      query: (params) => {
        const sp = new URLSearchParams();
        if (params?.projectId) sp.set("projectId", params.projectId);
        if (params?.weeks) sp.set("weeks", String(params.weeks));
        const q = sp.toString();
        return q ? `/api/analytics/priority-burndown?${q}` : "/api/analytics/priority-burndown";
      },
      providesTags: ["Analytics"],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useGetTasksQuery,
  useGetTaskQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useAddCommentMutation,
  useGetTeamsQuery,
  useGetTeamQuery,
  useCreateTeamMutation,
  useUpdateTeamMutation,
  useDeleteTeamMutation,
  useAddTeamMemberMutation,
  useRemoveTeamMemberMutation,
  useGetUsersQuery,
  useGetUserQuery,
  useUpdateUserMutation,
  useSearchQuery,
  useLazySearchQuery,
  useGetActivityQuery,
  useGetMyWorkQuery,
  useGetWorkloadHeatmapQuery,
  useGetPriorityBurndownQuery,
} = syncspaceApi;
