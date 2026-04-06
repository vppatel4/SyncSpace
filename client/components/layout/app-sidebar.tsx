"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  Users,
  BookUser,
  Flag,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useGetProjectsQuery } from "@/store/api/syncspaceApi";
import { Skeleton } from "@/components/ui/skeleton";

const mainNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/my-work", label: "My Work", icon: ListTodo },
  { href: "/teams", label: "Teams", icon: Users },
  { href: "/people", label: "People", icon: BookUser },
  { href: "/priority", label: "Priority", icon: Flag },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const { data, isLoading } = useGetProjectsQuery();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-border bg-card/80 backdrop-blur-xl transition-[width] duration-200 md:flex",
        collapsed ? "w-[72px]" : "w-[240px]",
      )}
    >
      <div className="flex h-16 items-center gap-2 border-b border-border px-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Sparkles className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold tracking-tight">SyncSpace</p>
            <p className="truncate text-[11px] text-muted-foreground">Stay in sync</p>
          </div>
        )}
        <Button type="button" variant="ghost" size="icon" className="ml-auto shrink-0" onClick={onToggle} aria-label="Toggle sidebar">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2 py-4">
        <nav className="space-y-1">
          {mainNav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="block">
                <motion.span
                  whileHover={{ x: 2 }}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/15 text-primary shadow-sm ring-1 ring-primary/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </motion.span>
              </Link>
            );
          })}
        </nav>

        {!collapsed && (
          <>
            <Separator className="my-4" />
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Projects</p>
            <div className="space-y-1">
              {isLoading &&
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-9 w-full rounded-lg" />)}
              {!isLoading &&
                data?.projects.slice(0, 6).map((p) => {
                  const active = pathname.includes(`/projects/${p.id}`);
                  return (
                    <Link key={p.id} href={`/projects/${p.id}`} className="block">
                      <span
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                          active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                        )}
                      >
                        <span className="h-2 w-2 rounded-full bg-primary/70" />
                        <span className="truncate">{p.name}</span>
                      </span>
                    </Link>
                  );
                })}
            </div>
          </>
        )}
      </ScrollArea>
    </aside>
  );
}
