import type { BadgeProps } from "@/components/ui/badge";

export function priorityVariant(p: string): NonNullable<BadgeProps["variant"]> {
  switch (p) {
    case "Urgent":
      return "danger";
    case "High":
      return "warning";
    case "Medium":
      return "info";
    case "Low":
      return "secondary";
    default:
      return "outline";
  }
}

export function statusLabel(status: string): string {
  switch (status) {
    case "ToDo":
      return "Todo";
    case "WorkInProgress":
      return "In Progress";
    case "UnderReview":
      return "Under Review";
    case "Completed":
      return "Done";
    default:
      return status;
  }
}

export function statusBadgeClass(status: string): string {
  switch (status) {
    case "ToDo":
      return "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30";
    case "WorkInProgress":
      return "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30";
    case "UnderReview":
      return "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30";
    case "Completed":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
    default:
      return "bg-muted text-muted-foreground";
  }
}
