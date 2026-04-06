"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { Moon, Search, Sun, User, LogOut, Command, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { NotificationsMenu } from "@/components/notifications-menu";
import { cn } from "@/lib/utils";

function crumbs(pathname: string): { label: string; href?: string }[] {
  if (pathname === "/dashboard") return [{ label: "Dashboard" }];
  const parts = pathname.split("/").filter(Boolean);
  const out: { label: string; href?: string }[] = [{ label: "SyncSpace", href: "/dashboard" }];
  let acc = "";
  for (const p of parts) {
    acc += `/${p}`;
    const label =
      p === "projects"
        ? "Projects"
        : p === "my-work"
          ? "My Work"
          : p === "teams"
            ? "Teams"
            : p === "settings"
              ? "Settings"
              : p === "priority"
                ? "Priority"
                : p === "focus"
                  ? "Focus"
                  : p === "people"
                    ? "People"
                    : p === "users"
                      ? "Profile"
                      : p === "timeline"
                      ? "Timeline"
                      : p.length > 18
                        ? `${p.slice(0, 14)}…`
                        : p;
    out.push({ label, href: acc });
  }
  return out;
}

export function AppHeader({
  onOpenCommand,
  onOpenShortcuts,
}: {
  onOpenCommand: () => void;
  onOpenShortcuts: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => setMounted(true), []);

  const trail = crumbs(pathname);

  const initials =
    session?.user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "SS";

  return (
    <TooltipProvider delayDuration={200}>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-6">
        <div className="hidden min-w-0 flex-1 items-center gap-2 md:flex">
          <nav className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {trail.map((c, i) => (
              <span key={`${c.label}-${i}`} className="flex items-center gap-2">
                {i > 0 && <span className="text-border">/</span>}
                {c.href && i < trail.length - 1 ? (
                  <Link href={c.href} className="hover:text-foreground">
                    {c.label}
                  </Link>
                ) : (
                  <span className={cn("font-semibold text-foreground", i === trail.length - 1 && "text-foreground")}>
                    {c.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
        </div>

        <div className="flex flex-1 items-center gap-2 md:max-w-xl">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && q.trim()) {
                  router.push(`/search?q=${encodeURIComponent(q.trim())}`);
                }
                if (e.key === "p" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  onOpenCommand();
                }
              }}
              placeholder="Search projects & tasks… (Enter)"
              className="h-10 rounded-lg pl-9"
            />
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="outline" size="icon" className="hidden shrink-0 md:inline-flex" onClick={onOpenCommand}>
                <Command className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Command palette (Ctrl+K)</TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="icon" onClick={() => onOpenShortcuts()} aria-label="Keyboard shortcuts">
                <span className="text-sm font-semibold">?</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Shortcuts (?)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="Toggle theme"
              >
                {mounted && theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle theme (D)</TooltipContent>
          </Tooltip>

          <NotificationsMenu />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                whileTap={{ scale: 0.98 }}
                className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                type="button"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={session?.user?.image ?? undefined} alt={session?.user?.name ?? "User"} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold leading-none">{session?.user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{session?.user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={session?.user?.id ? `/users/${session.user.id}` : "/settings"} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </TooltipProvider>
  );
}
