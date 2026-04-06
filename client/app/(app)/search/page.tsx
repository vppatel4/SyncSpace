"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FolderKanban, ListTodo } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useLazySearchQuery } from "@/store/api/syncspaceApi";

function SearchInner() {
  const params = useSearchParams();
  const initial = params.get("q") ?? "";
  const [q, setQ] = useState(initial);
  const [runSearch, { data, isFetching }] = useLazySearchQuery();

  useEffect(() => {
    if (initial) {
      setQ(initial);
      void runSearch(initial);
    }
  }, [initial, runSearch]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) void runSearch(q.trim());
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Search</h1>
        <p className="text-sm text-muted-foreground">Global search across your SyncSpace projects and tasks.</p>
      </div>
      <form onSubmit={onSubmit}>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="h-11" />
      </form>

      {isFetching && (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      )}

      {data && !isFetching && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FolderKanban className="h-4 w-4" />
                Projects ({data.projects.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.projects.length === 0 && <p className="text-sm text-muted-foreground">No projects matched.</p>}
              {data.projects.map((p) => (
                <Link key={p.id} href={`/projects/${p.id}`} className="block rounded-lg border border-border/60 px-3 py-2 text-sm hover:bg-muted/50">
                  {p.name}
                </Link>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ListTodo className="h-4 w-4" />
                Tasks ({data.tasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.tasks.length === 0 && <p className="text-sm text-muted-foreground">No tasks matched.</p>}
              {data.tasks.map((t) => (
                <Link
                  key={t.id}
                  href={`/projects/${t.projectId}?task=${t.id}`}
                  className="block rounded-lg border border-border/60 px-3 py-2 text-sm hover:bg-muted/50"
                >
                  <span className="font-medium">{t.title}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{t.project.name}</span>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-11 w-full" />
        </div>
      }
    >
      <SearchInner />
    </Suspense>
  );
}
