"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useGetProjectsQuery, useLazySearchQuery } from "@/store/api/syncspaceApi";
import { FolderKanban, ListTodo, LayoutDashboard, Users, BookUser, Flag, Settings } from "lucide-react";

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter();
  const { data: projects } = useGetProjectsQuery();
  const [runSearch, { data: searchData }] = useLazySearchQuery();
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (q.trim().length >= 2) void runSearch(q.trim());
    }, 200);
    return () => clearTimeout(t);
  }, [q, runSearch]);

  const nav = useMemo(
    () => [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Projects", href: "/projects", icon: FolderKanban },
      { label: "My Work", href: "/my-work", icon: ListTodo },
      { label: "Teams", href: "/teams", icon: Users },
      { label: "People", href: "/people", icon: BookUser },
      { label: "Priority view", href: "/priority", icon: Flag },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
    [],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-xl">
        <Command className="rounded-xl border border-border bg-popover shadow-xl [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-4 [&_[cmdk-item]_svg]:w-4">
          <div className="flex items-center border-b border-border px-3">
            <Command.Input
              value={q}
              onValueChange={setQ}
              placeholder="Type a command or search…"
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Command.List className="max-h-[min(60vh,420px)] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">No results.</Command.Empty>

            <Command.Group heading="Navigate">
              {nav.map((item) => (
                <Command.Item
                  key={item.href}
                  value={`${item.label} ${item.href}`}
                  onSelect={() => {
                    onOpenChange(false);
                    router.push(item.href);
                  }}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 aria-selected:bg-accent"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Command.Item>
              ))}
            </Command.Group>

            {projects?.projects?.length ? (
              <Command.Group heading="Projects">
                {projects.projects.map((p) => (
                  <Command.Item
                    key={p.id}
                    value={`${p.name} project`}
                    onSelect={() => {
                      onOpenChange(false);
                      router.push(`/projects/${p.id}`);
                    }}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 aria-selected:bg-accent"
                  >
                    <FolderKanban className="h-4 w-4" />
                    {p.name}
                  </Command.Item>
                ))}
              </Command.Group>
            ) : null}

            {searchData && (searchData.projects.length > 0 || searchData.tasks.length > 0) ? (
              <>
                {searchData.projects.length > 0 ? (
                  <Command.Group heading="Search — Projects">
                    {searchData.projects.map((p) => (
                      <Command.Item
                        key={p.id}
                        value={p.name}
                        onSelect={() => {
                          onOpenChange(false);
                          router.push(`/projects/${p.id}`);
                        }}
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 aria-selected:bg-accent"
                      >
                        <FolderKanban className="h-4 w-4" />
                        {p.name}
                      </Command.Item>
                    ))}
                  </Command.Group>
                ) : null}
                {searchData.tasks.length > 0 ? (
                  <Command.Group heading="Search — Tasks">
                    {searchData.tasks.map((t) => (
                      <Command.Item
                        key={t.id}
                        value={t.title}
                        onSelect={() => {
                          onOpenChange(false);
                          router.push(`/projects/${t.projectId}?task=${t.id}`);
                        }}
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 aria-selected:bg-accent"
                      >
                        <ListTodo className="h-4 w-4" />
                        {t.title}
                      </Command.Item>
                    ))}
                  </Command.Group>
                ) : null}
              </>
            ) : null}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
