"use client";

import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { ActivityItem } from "@/types/api";

export function TaskPulse({
  items,
  isLoading,
}: {
  items: ActivityItem[] | undefined;
  isLoading: boolean;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base font-semibold">Task Pulse</CardTitle>
          <p className="text-xs text-muted-foreground">Live activity — refreshes every 30s</p>
        </div>
        <Activity className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[320px] pr-3">
          <div className="space-y-3 p-1">
            {isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex gap-3 rounded-lg border border-border/60 p-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            {!isLoading &&
              items?.map((log, idx) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className="flex gap-3 rounded-lg border border-border/60 bg-card/40 p-3"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={log.user.image ?? undefined} alt={log.user.name} />
                    <AvatarFallback>{log.user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug">
                      <span className="text-foreground">{log.user.name}</span>{" "}
                      <span className="font-normal text-muted-foreground">{log.message}</span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </motion.div>
              ))}
            {!isLoading && !items?.length && (
              <p className="p-6 text-sm text-muted-foreground">No activity yet — move a task to see the pulse.</p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
