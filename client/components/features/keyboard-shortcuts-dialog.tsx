"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const rows = [
  { keys: "N", desc: "Open quick capture (new task)" },
  { keys: "Ctrl K / ⌘ K", desc: "Command palette" },
  { keys: "P", desc: "Focus search / palette" },
  { keys: "D", desc: "Toggle dark mode" },
  { keys: "F", desc: "Focus mode (from task panel)" },
  { keys: "Escape", desc: "Close modal / exit focus" },
  { keys: "?", desc: "This help" },
];

export function KeyboardShortcutsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>Power-user navigation across SyncSpace.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.keys} className="flex items-center justify-between gap-4 rounded-lg border border-border px-3 py-2 text-sm">
              <span className="text-muted-foreground">{r.desc}</span>
              <kbd className="rounded-md border border-border bg-muted px-2 py-1 font-mono text-xs">{r.keys}</kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
