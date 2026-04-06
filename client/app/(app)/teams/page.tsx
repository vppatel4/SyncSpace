"use client";

import { useState } from "react";
import { Plus, Users } from "lucide-react";
import toast from "react-hot-toast";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAddTeamMemberMutation, useCreateTeamMutation, useGetTeamsQuery } from "@/store/api/syncspaceApi";
import { motion } from "framer-motion";

const teamSchema = z.object({ name: z.string().min(1), description: z.string().max(2000).optional() });
const memberSchema = z.object({ username: z.string().min(2) });

export default function TeamsPage() {
  const { data, isLoading } = useGetTeamsQuery();
  const [createTeam, { isLoading: creating }] = useCreateTeamMutation();
  const [addMember, { isLoading: inviting }] = useAddTeamMemberMutation();

  const [open, setOpen] = useState(false);
  const [tName, setTName] = useState("");
  const [tDesc, setTDesc] = useState("");

  const [memberOpen, setMemberOpen] = useState(false);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [username, setUsername] = useState("");

  const onCreate = async () => {
    const parsed = teamSchema.safeParse({ name: tName, description: tDesc || undefined });
    if (!parsed.success) {
      toast.error("Enter a team name.");
      return;
    }
    try {
      await createTeam({ name: parsed.data.name, description: parsed.data.description ?? null }).unwrap();
      toast.success("Team created");
      setOpen(false);
      setTName("");
      setTDesc("");
    } catch {
      toast.error("Could not create team");
    }
  };

  const onInvite = async () => {
    const parsed = memberSchema.safeParse({ username });
    if (!parsed.success || !teamId) {
      toast.error("Enter a username.");
      return;
    }
    try {
      await addMember({ teamId, username: parsed.data.username }).unwrap();
      toast.success("Member added");
      setMemberOpen(false);
      setUsername("");
    } catch {
      toast.error("User not found or already a member");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
          <p className="text-sm text-muted-foreground">Invite collaborators and organize SyncSpace access.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New team
        </Button>
      </div>

      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          {data?.teams.map((t, idx) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
              <Card className="h-full border-border/80">
                <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Users className="h-5 w-5 text-primary" />
                      {t.name}
                    </CardTitle>
                    <CardDescription>{t.description ?? "No description"}</CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={() => {
                      setTeamId(t.id);
                      setMemberOpen(true);
                    }}
                  >
                    Invite
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {t.members?.map((m) => (
                      <div key={m.id} className="flex items-center gap-2 rounded-full border border-border/70 bg-muted/30 px-2 py-1 text-xs">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={m.user.image ?? undefined} />
                          <AvatarFallback className="text-[10px]">{m.user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{m.user.name}</span>
                        <span className="text-muted-foreground">· {m.role}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {!isLoading && data?.teams.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          No teams yet — create one to invite teammates by username.
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create team</DialogTitle>
            <DialogDescription>Owners can invite admins and members by SyncSpace username.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={tName} onChange={(e) => setTName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={tDesc} onChange={(e) => setTDesc(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={creating} onClick={() => void onCreate()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={memberOpen} onOpenChange={setMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite member</DialogTitle>
            <DialogDescription>Enter their SyncSpace username (e.g. vidhipatel).</DialogDescription>
          </DialogHeader>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
          <DialogFooter>
            <Button variant="secondary" onClick={() => setMemberOpen(false)}>
              Cancel
            </Button>
            <Button disabled={inviting} onClick={() => void onInvite()}>
              Send invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
