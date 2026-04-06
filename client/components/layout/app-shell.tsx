"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { CommandPalette } from "@/components/features/command-palette";
import { KeyboardShortcutsDialog } from "@/components/features/keyboard-shortcuts-dialog";
import { QuickCaptureFab } from "@/components/features/quick-capture";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const inField = tag === "input" || tag === "textarea" || target?.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen(true);
        return;
      }
      if (e.key === "?" && !inField) {
        e.preventDefault();
        setHelpOpen(true);
        return;
      }
      if (e.key.toLowerCase() === "n" && !inField) {
        e.preventDefault();
        document.querySelector<HTMLButtonElement>('[aria-label="Quick capture"]')?.click();
        return;
      }
      if (e.key.toLowerCase() === "d" && !inField) {
        e.preventDefault();
        setTheme(theme === "dark" ? "light" : "dark");
        return;
      }
      if (e.key.toLowerCase() === "p" && !inField) {
        e.preventDefault();
        setCommandOpen(true);
        return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setTheme, theme]);

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      <div
        className={cn(
          "flex min-h-screen flex-col transition-[padding] duration-200 md:pl-[240px]",
          collapsed && "md:pl-[72px]",
        )}
      >
        <AppHeader onOpenCommand={() => setCommandOpen(true)} onOpenShortcuts={() => setHelpOpen(true)} />
        <motion.main
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1 px-4 pb-24 pt-4 md:px-8 md:pb-10"
        >
          {children}
        </motion.main>
      </div>
      <MobileBottomNav />
      <QuickCaptureFab />
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      <KeyboardShortcutsDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
}
