"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGetActivityQuery } from "@/store/api/syncspaceApi";
import { Skeleton } from "@/components/ui/skeleton";

export function NotificationsMenu() {
  const { data, isLoading, isFetching } = useGetActivityQuery(15, {
    pollingInterval: 60_000,
  });

  const items = data?.items ?? [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="h-4 w-4" />
          {items.length > 0 && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" aria-hidden />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <DropdownMenuLabel className="px-3 py-2">Recent activity</DropdownMenuLabel>
        <DropdownMenuSeparator className="m-0" />
        <ScrollArea className="h-[min(360px,50vh)]">
          {isLoading || isFetching ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-md" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">No recent activity yet.</p>
          ) : (
            <ul className="flex flex-col gap-0.5 p-1">
              {items.map((log) => (
                <li key={log.id}>
                  <Link
                    href={
                      log.task?.id && log.project?.id
                        ? `/projects/${log.project.id}?task=${log.task.id}`
                        : log.project?.id
                          ? `/projects/${log.project.id}`
                          : "/dashboard"
                    }
                    className="block rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted"
                  >
                    <span className="line-clamp-2 text-foreground">{log.message}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
        <DropdownMenuSeparator className="m-0" />
        <div className="p-2">
          <Button asChild variant="ghost" size="sm" className="w-full text-muted-foreground">
            <Link href="/dashboard">Open dashboard</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
