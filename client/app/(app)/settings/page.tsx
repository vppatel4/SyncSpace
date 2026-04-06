"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useUpdateUserMutation } from "@/store/api/syncspaceApi";

const profileSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export default function SettingsPage() {
  const { data: session } = useSession();
  const [updateUser, { isLoading }] = useUpdateUserMutation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [image, setImage] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name ?? "");
      setEmail(session.user.email ?? "");
    }
  }, [session?.user]);

  const onSaveProfile = async () => {
    const parsed = profileSchema.safeParse({ name, email });
    if (!parsed.success || !session?.user?.id) {
      toast.error("Check name and email.");
      return;
    }
    try {
      await updateUser({
        id: session.user.id,
        body: {
          name: parsed.data.name,
          email: parsed.data.email,
          image: image.trim() || null,
        },
      }).unwrap();
      toast.success("Profile updated — sign in again to refresh session if email changed");
    } catch {
      toast.error("Could not update profile");
    }
  };

  const onChangePassword = async () => {
    const parsed = passwordSchema.safeParse({ currentPassword, newPassword });
    if (!parsed.success || !session?.user?.id) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    try {
      await updateUser({
        id: session.user.id,
        body: {
          currentPassword: parsed.data.currentPassword,
          newPassword: parsed.data.newPassword,
        },
      }).unwrap();
      toast.success("Password updated");
      setCurrentPassword("");
      setNewPassword("");
    } catch {
      toast.error("Current password incorrect or update failed");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Account and SyncSpace preferences.</p>
      </div>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your name and email appear across activity and assignments.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="image">Avatar URL (optional)</Label>
            <Input id="image" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://…" />
          </div>
          <Button type="button" disabled={isLoading} onClick={() => void onSaveProfile()}>
            Save profile
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Change your password. Use a strong secret you do not reuse elsewhere.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cur">Current password</Label>
            <Input id="cur" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new">New password</Label>
            <Input id="new" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <Button type="button" variant="secondary" disabled={isLoading} onClick={() => void onChangePassword()}>
            Update password
          </Button>
        </CardContent>
      </Card>

      <Separator />
      <p className="text-center text-xs text-muted-foreground">© 2024 SyncSpace — Built with ❤️ by Vidhi Patel</p>
    </div>
  );
}
