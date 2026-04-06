"use client";

import { useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

const schema = z.object({
  email: z.string().email(),
});

const apiBase = process.env.NEXT_PUBLIC_SYNCSPACE_API_URL ?? "http://localhost:4000";

type ForgotResponse = {
  message?: string;
  emailDispatched?: boolean;
  devResetUrl?: string;
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [result, setResult] = useState<ForgotResponse | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${apiBase}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: parsed.data.email }),
      });
      const data = (await res.json()) as ForgotResponse & { message?: string };
      if (!res.ok) {
        toast.error(data.message ?? "Something went wrong.");
        return;
      }
      setResult(data);
      setSent(true);
      if (data.emailDispatched) {
        toast.success("If an account exists, check your inbox (and spam).");
      } else if (data.devResetUrl) {
        toast.success("Development mode: use the link below.");
      } else {
        toast.success(data.message ?? "Request received.");
      }
    } finally {
      setLoading(false);
    }
  };

  const copyDevLink = async () => {
    if (!result?.devResetUrl) return;
    try {
      await navigator.clipboard.writeText(result.devResetUrl);
      toast.success("Link copied to clipboard.");
    } catch {
      toast.error("Could not copy.");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">SyncSpace</h1>
          <p className="text-sm text-muted-foreground">One shared space where teams stay perfectly in sync.</p>
        </div>
        <Card className="border-border/80 shadow-xl">
          <CardHeader>
            <CardTitle>Reset password</CardTitle>
            <CardDescription>
              {sent
                ? "Follow the instructions below to finish resetting your password."
                : "Enter your email and we'll send you a reset link."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!sent ? (
              <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending…" : "Send reset link"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  <Link href="/login" className="font-medium text-primary hover:underline">
                    Back to sign in
                  </Link>
                </p>
              </form>
            ) : (
              <div className="space-y-4">
                {result?.emailDispatched ? (
                  <p className="text-sm text-muted-foreground">
                    If an account exists for that address, we sent a message with a link (valid for one hour). Check your spam folder
                    too.
                  </p>
                ) : result?.devResetUrl ? (
                  <div className="space-y-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                    <p className="font-medium text-amber-200">Local development</p>
                    <p className="text-muted-foreground">
                      Email is not configured on the server, but you can use this one-time link:
                    </p>
                    <p className="break-all font-mono text-xs text-foreground">{result.devResetUrl}</p>
                    <Button type="button" variant="secondary" size="sm" className="w-full" onClick={() => void copyDevLink()}>
                      Copy link
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                    <p>
                      This server is not configured to send email. Add{" "}
                      <code className="rounded bg-muted px-1 py-0.5 text-xs">SYNCSPACE_RESEND_API_KEY</code> or SMTP variables to{" "}
                      <code className="rounded bg-muted px-1 py-0.5 text-xs">server/.env</code> so reset links are delivered to the inbox.
                    </p>
                  </div>
                )}
                <Button asChild className="w-full" variant="secondary">
                  <Link href="/login">Back to sign in</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        <p className="mt-8 text-center text-xs text-muted-foreground">© 2024 SyncSpace — Built with ❤️ by Vidhi Patel</p>
      </motion.div>
    </div>
  );
}
