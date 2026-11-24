import { Keyboard } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const shortcuts = [
  {
    category: "Navigation",
    items: [
      { keys: ["↑", "↓"], description: "Navigate between emails" },
      { keys: ["Enter"], description: "Open selected email" },
      { keys: ["Esc"], description: "Close email detail" },
    ],
  },
  {
    category: "Actions",
    items: [
      { keys: ["C"], description: "Compose new email" },
      { keys: ["R"], description: "Refresh mailbox" },
      { keys: ["S"], description: "Star/unstar email" },
      { keys: ["D"], description: "Delete email" },
    ],
  },
  {
    category: "Email Detail",
    items: [
      { keys: ["Reply"], description: "Reply to email (use button)" },
      { keys: ["Reply All"], description: "Reply to all (use button)" },
      { keys: ["Forward"], description: "Forward email (use button)" },
    ],
  },
];

export function KeyboardShortcutsHelp({ open, onOpenChange }: KeyboardShortcutsHelpProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Keyboard className="size-5" />
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </div>
          <DialogDescription>
            Use these keyboard shortcuts to navigate and manage your emails faster
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {shortcuts.map((section) => (
            <div key={section.category}>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {section.category}
              </h3>
              <div className="space-y-2">
                {section.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <span className="text-sm">{item.description}</span>
                    <div className="flex gap-1">
                      {item.keys.map((key, keyIndex) => (
                        <kbd
                          key={keyIndex}
                          className="rounded-md border border-gray-200 bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-lg bg-muted p-4 text-sm text-muted-foreground">
          <p className="mb-1 font-medium">Note:</p>
          <p>
            Keyboard shortcuts won't work when you're typing in an input field or composing an
            email.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
