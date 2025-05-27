"use client";

import { useEffect, useState } from "react";

import dynamic from "next/dynamic";

import { DndProvider } from "@/components/dnd/DndProvider";
import { AppNav } from "@/components/navigation/AppNav";
import { PrivacyProvider } from "@/components/providers/PrivacyProvider";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { SetupCheck } from "@/components/setup/SetupCheck";
import { CommandPalette } from "@/components/ui/command-palette";
import { CommandPaletteFab } from "@/components/ui/command-palette-fab";
import { CommandPaletteHint } from "@/components/ui/command-palette-hint";
import { ShortcutsModal } from "@/components/ui/shortcuts-modal";
import { Toaster } from "@/components/ui/sonner";

import { usePageTitle } from "@/hooks/use-page-title";

import { useUIStore } from "@/store/ui";

import "../globals.css";

// Dynamically import the NotificationProvider based on SAAS flag
const NotificationProvider = dynamic<{ children: React.ReactNode }>(
  () =>
    import(
      `@/components/providers/NotificationProvider${
        process.env.NEXT_PUBLIC_ENABLE_SAAS_FEATURES === "true"
          ? ".saas"
          : ".open"
      }`
    ).then((mod) => mod.NotificationProvider),
  {
    ssr: false,
    loading: () => <>{/* Render nothing while loading */}</>,
  }
);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const { shortcutsModalOpen, setShortcutsModalOpen } = useUIStore();

  // Use the page title hook
  usePageTitle();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen((open) => !open);
      } else if (e.key === "?" && !(e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShortcutsModalOpen(true);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setShortcutsModalOpen]);

  return (
    <div className="flex min-h-screen flex-col">
      <SessionProvider>
        <PrivacyProvider>
          <DndProvider>
            <SetupCheck />
            <CommandPalette
              open={commandPaletteOpen}
              onOpenChange={setCommandPaletteOpen}
            />
            <CommandPaletteHint />
            <CommandPaletteFab />
            <ShortcutsModal
              isOpen={shortcutsModalOpen}
              onClose={() => setShortcutsModalOpen(false)}
            />
            <AppNav />
            <main className="relative flex-1">
              <NotificationProvider>{children}</NotificationProvider>
            </main>
            <Toaster />
          </DndProvider>
        </PrivacyProvider>
      </SessionProvider>
    </div>
  );
}
