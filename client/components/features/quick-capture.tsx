"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateTaskMutation, useGetProjectsQuery, useGetTeamsQuery } from "@/store/api/syncspaceApi";
import { useSession } from "next-auth/react";

export function QuickCaptureFab() {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const { data: projects } = useGetProjectsQuery();
  const { data: teamsData } = useGetTeamsQuery();
  const [createTask, { isLoading }] = useCreateTaskMutation();

  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [priority, setPriority] = useState<string>("Medium");

  const reset = () => {
    setTitle("");
    setProjectId(projects?.projects?.[0]?.id ?? "");
    setPriority("Medium");
  };

  const onOpen = (v: boolean) => {
    setOpen(v);
    if (v) {
      reset();
      if (projects?.projects?.[0]?.id) setProjectId(projects.projects[0].id);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !projectId || !session?.user?.id) {
      toast.error("Title and project are required.");
      return;
    }
    try {
      await createTask({
        title: title.trim(),
        priority,
        projectId,
        assigneeId: session.user.id,
      }).unwrap();
      toast.success("Task created");
      setOpen(false);
      reset();
    } catch {
      toast.error("Could not create task");
    }
  };

  return (
    <>
      <motion.button
        type="button"
        aria-label="Quick capture"
        onClick={() => onOpen(true)}
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 md:bottom-8 md:right-8"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
      >
        <Plus className="h-6 w-6" />
      </motion.button>

      <Sheet open={open} onOpenChange={onOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Quick capture</SheetTitle>
            <SheetDescription>Create a task in seconds without leaving your flow.</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4 px-2 pb-8">
            <div className="space-y-2">
              <Label htmlFor="qc-title">Title</Label>
              <Input id="qc-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to be done?" autoFocus />
            </div>
            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Urgent", "High", "Medium", "Low"].map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
              Teams available:{" "}
              <span className="font-medium text-foreground">
                {teamsData?.teams?.length ? teamsData.teams.map((t) => t.name).join(", ") : "—"}
              </span>
            </div>
            <Button className="w-full" disabled={isLoading} onClick={() => void handleSubmit()}>
              {isLoading ? "Saving…" : "Create task"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
