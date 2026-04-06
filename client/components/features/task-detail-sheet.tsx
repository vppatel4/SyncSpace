"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ExternalLink, Focus, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAddCommentMutation, useGetTaskQuery, useUpdateTaskMutation } from "@/store/api/syncspaceApi";
import { priorityVariant, statusLabel } from "@/lib/task-styles";
import type { TaskDetail } from "@/types/api";

export function TaskDetailSheet({
  taskId,
  open,
  onOpenChange,
}: {
  taskId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data, isLoading, refetch } = useGetTaskQuery(taskId ?? "", { skip: !taskId || !open, refetchOnMountOrArgChange: true });
  const [updateTask, { isLoading: saving }] = useUpdateTaskMutation();
  const [addComment, { isLoading: commenting }] = useAddCommentMutation();
  const [comment, setComment] = useState("");

  const task = data?.task;

  useEffect(() => {
    if (open && taskId) void refetch();
  }, [open, taskId, refetch]);

  const toggleSub = async (t: TaskDetail, subId: string, completed: boolean) => {
    if (!task) return;
    const next = (task.subTasks ?? []).map((s) => (s.id === subId ? { ...s, completed } : s));
    try {
      await updateTask({
        id: t.id,
        body: {
          subTasks: next.map((s) => ({ title: s.title, completed: s.completed, position: s.position })),
          projectId: t.projectId,
        },
      }).unwrap();
    } catch {
      toast.error("Could not update checklist");
    }
  };

  const postComment = async () => {
    if (!taskId || !comment.trim()) return;
    try {
      await addComment({ taskId, content: comment.trim() }).unwrap();
      setComment("");
      toast.success("Comment added");
    } catch {
      toast.error("Could not add comment");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="pr-8 text-left">{isLoading ? "Loading…" : task?.title}</SheetTitle>
          <SheetDescription className="text-left">
            {task ? (
              <span className="flex flex-wrap items-center gap-2">
                <Badge variant={priorityVariant(task.priority)}>{task.priority}</Badge>
                <span className="text-muted-foreground">{statusLabel(task.status)}</span>
                {task.project && <span className="text-muted-foreground">· {task.project.name}</span>}
              </span>
            ) : null}
          </SheetDescription>
        </SheetHeader>

        {task && (
          <div className="mt-4 flex flex-1 flex-col gap-4 overflow-hidden px-1 pb-8">
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="secondary">
                <Link href={`/focus/${task.id}`}>
                  <Focus className="mr-2 h-4 w-4" />
                  Focus mode
                </Link>
              </Button>
              {task.blockedBy && (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/projects/${task.projectId}?task=${task.blockedBy.id}`}>
                    Blocked by: {task.blockedBy.title}
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </Link>
                </Button>
              )}
            </div>

            <Tabs defaultValue="details" className="flex min-h-0 flex-1 flex-col">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="comments">
                  Comments <MessageSquare className="ml-2 h-4 w-4" />
                </TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="mt-4 flex min-h-0 flex-1 flex-col">
                <ScrollArea className="h-[calc(100vh-220px)] pr-3">
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">{task.description ?? "No description yet."}</p>
                  <div className="mt-4 flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={task.assignee?.image ?? undefined} />
                      <AvatarFallback>{task.assignee?.name?.slice(0, 2).toUpperCase() ?? "?"}</AvatarFallback>
                    </Avatar>
                    <div className="text-sm">
                      <p className="font-medium">{task.assignee?.name ?? "Unassigned"}</p>
                      <p className="text-xs text-muted-foreground">
                        Due {task.dueDate ? format(new Date(task.dueDate), "MMM d, yyyy") : "—"}
                      </p>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Checklist</p>
                  <div className="space-y-2">
                    {(task.subTasks ?? []).map((s) => (
                      <label key={s.id} className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm">
                        <Checkbox checked={s.completed} onCheckedChange={(v) => void toggleSub(task, s.id, Boolean(v))} disabled={saving} />
                        <span className={s.completed ? "text-muted-foreground line-through" : ""}>{s.title}</span>
                      </label>
                    ))}
                    {!task.subTasks?.length && <p className="text-sm text-muted-foreground">No sub-tasks yet.</p>}
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="comments" className="mt-4 flex min-h-0 flex-1 flex-col">
                <ScrollArea className="h-[320px] pr-3">
                  <div className="space-y-3">
                    {(task.comments ?? []).map((c) => (
                      <div key={c.id} className="rounded-lg border border-border/60 p-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={c.user.image ?? undefined} />
                            <AvatarFallback>{c.user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{c.user.name}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(c.createdAt), "MMM d, h:mm a")}</p>
                          </div>
                        </div>
                        <p className="mt-2 text-sm">{c.content}</p>
                      </div>
                    ))}
                    {!task.comments?.length && <p className="text-sm text-muted-foreground">No comments yet.</p>}
                  </div>
                </ScrollArea>
                <div className="mt-3 flex gap-2">
                  <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Write a comment…" />
                  <Button type="button" disabled={commenting} onClick={() => void postComment()}>
                    Send
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
