import { Button } from "@/components/ui/button";

export function EmptyProjects({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
      <svg
        className="mb-6 h-40 w-full max-w-md text-primary"
        viewBox="0 0 480 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <rect x="24" y="40" width="140" height="90" rx="12" className="fill-card stroke-border" strokeWidth="2" />
        <rect x="200" y="24" width="160" height="120" rx="14" className="fill-primary/10 stroke-primary/40" strokeWidth="2" />
        <rect x="380" y="56" width="76" height="76" rx="12" className="fill-card stroke-border" strokeWidth="2" />
        <path d="M60 120h70" className="stroke-muted-foreground" strokeWidth="4" strokeLinecap="round" />
        <path d="M230 90h110" className="stroke-primary" strokeWidth="4" strokeLinecap="round" />
        <circle cx="120" cy="70" r="8" className="fill-primary" />
      </svg>
      <h2 className="text-xl font-bold tracking-tight">No projects yet</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Create your first SyncSpace project to unlock Kanban boards, timelines, and team collaboration.
      </p>
      <Button className="mt-6" onClick={onCreate}>
        Create a project
      </Button>
    </div>
  );
}

export function EmptyTasks() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
      <svg className="mb-4 h-28 w-28 text-primary" viewBox="0 0 120 120" aria-hidden>
        <rect x="16" y="24" width="88" height="72" rx="12" className="fill-card stroke-border" strokeWidth="2" />
        <path d="M36 52h48M36 68h32" className="stroke-muted-foreground" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <p className="text-sm font-medium">No tasks match this view</p>
      <p className="mt-1 text-xs text-muted-foreground">Try another filter or create a task from Quick Capture.</p>
    </div>
  );
}
