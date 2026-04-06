import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

/** Human-readable message from RTK Query / fetchBaseQuery errors after unwrap() rejects */
export function getRtkQueryErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== "object") return fallback;

  const e = error as FetchBaseQueryError & { error?: string };

  if (e.status === "FETCH_ERROR" || e.error === "TypeError" || e.error === "Failed to fetch") {
    return "Cannot reach the API. Start the backend: from the repo root run npm run dev (starts port 4000 + 3000), or run npm run dev:server in another terminal.";
  }

  if (e.status === 401) {
    return "Your session expired — sign out and sign in again.";
  }

  const data = e.data;
  if (typeof data === "object" && data !== null && "message" in data) {
    const m = (data as { message?: unknown }).message;
    if (typeof m === "string" && m.length) return m;
  }
  if (typeof data === "string" && data.length) return data;

  if (typeof e.status === "number") {
    return `${fallback} (HTTP ${e.status})`;
  }

  return fallback;
}
