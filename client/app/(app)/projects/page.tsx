"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, FolderKanban } from "lucide-react";
import toast from "react-hot-toast";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useCreateProjectMutation, useGetProjectsQuery } from "@/store/api/syncspaceApi";
import { EmptyProjects } from "@/components/illustrations/empty-states";
import { priorityVariant } from "@/lib/task-styles";
import { getRtkQueryErrorMessage } from "@/lib/rtk-error";

const schema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
});

export default function ProjectsPage() {
  const { data, isLoading } = useGetProjectsQuery();
  const [createProject, { isLoading: creating }] = useCreateProjectMutation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");

  const onCreate = async () => {
    const parsed = schema.safeParse({ name, description: description || undefined });
    if (!parsed.success) {
      toast.error("Please enter a project name.");
      return;
    }
    try {
      await createProject({
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        priority,
      }).unwrap();
      toast.success("Project created");
      setOpen(false);
      setName("");
      setDescription("");
    } catch (err) {
      toast.error(getRtkQueryErrorMessage(err, "Could not create project"));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">Plan, prioritize, and ship with SyncSpace boards.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New project
        </Button>
      </div>

      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && data?.projects.length === 0 && (
        <EmptyProjects onCreate={() => setOpen(true)} />
      )}

      {!isLoading && data && data.projects.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.projects.map((p, idx) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
              <Link href={`/projects/${p.id}`} className="block h-full">
                <Card className="h-full border-border/80 transition-shadow hover:shadow-lg">
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <FolderKanban className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-lg leading-snug">{p.name}</CardTitle>
                      </div>
                      <Badge variant={priorityVariant(p.priority)}>{p.priority}</Badge>
                    </div>
                    <CardDescription className="line-clamp-2">{p.description ?? "No description yet."}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{p.status}</span>
                      <span>{p._count?.tasks ?? 0} tasks</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create project</DialogTitle>
            <DialogDescription>A new SyncSpace container for tasks, teams, and timelines.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="p-name">Name</Label>
              <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. SyncSpace Platform Launch" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-desc">Description</Label>
              <Input id="p-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Urgent", "High", "Medium", "Low"].map((pr) => (
                    <SelectItem key={pr} value={pr}>
                      {pr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={creating} onClick={() => void onCreate()}>
              {creating ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
