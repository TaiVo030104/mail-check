import { Keyboard, Lightbulb } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { emailShortcuts, formatShortcut } from "@/hooks/use-keyboard-shortcuts";

interface AdvancedShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdvancedShortcutsHelp({ open, onOpenChange }: AdvancedShortcutsHelpProps) {
  const categories = [
    { name: "Navigation", shortcuts: emailShortcuts.navigation },
    { name: "Actions", shortcuts: emailShortcuts.actions },
    { name: "Selection", shortcuts: emailShortcuts.selection },
    { name: "Search", shortcuts: emailShortcuts.search },
    { name: "General", shortcuts: emailShortcuts.general },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-3xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Keyboard className="size-5" />
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </div>
          <DialogDescription>Master these keyboard shortcuts to navigate faster</DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {categories.map((category) => (
              <div key={category.name}>
                <h3 className="mb-3 text-sm font-semibold text-primary">{category.name}</h3>
                <div className="space-y-2">
                  {category.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-md px-3 py-2 transition-colors hover:bg-muted/50"
                    >
                      <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                      <kbd className="rounded border border-border bg-muted px-2 py-1 text-xs font-semibold text-primary">
                        {formatShortcut(shortcut)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {}
            <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4">
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                <Lightbulb className="size-4" /> Pro Tips
              </h3>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>
                  • Use <kbd className="rounded bg-muted px-1 py-0.5">j/k</kbd> for quick navigation
                  through emails
                </li>
                <li>
                  • Press <kbd className="rounded bg-muted px-1 py-0.5">x</kbd> to select, then use
                  bulk actions
                </li>
                <li>
                  • Use <kbd className="rounded bg-muted px-1 py-0.5">g + i/s/d</kbd> combos to jump
                  to folders
                </li>
                <li>
                  • Press <kbd className="rounded bg-muted px-1 py-0.5">/</kbd> to quickly search
                  emails
                </li>
                <li>
                  • <kbd className="rounded bg-muted px-1 py-0.5">Esc</kbd> closes any dialog or
                  modal
                </li>
              </ul>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
