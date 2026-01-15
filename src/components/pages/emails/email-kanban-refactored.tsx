import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, RefreshCcw, Settings, Sparkles } from "lucide-react";
import type { JSX } from "react";
import { useEffect, useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import { SnoozeCountdown } from "@/components/SnoozeCountdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useEmailsByFolder } from "@/hooks/react-query/useEmails";
import {
  useCreateColumn,
  useDeleteColumn,
  useKanbanBoard,
  useMoveCard,
  useUpdateColumn,
} from "@/hooks/react-query/useKanban";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Email } from "@/services/email";

import { EmailDetail } from "./email-detail";
import { EmailFilterValues } from "./email-filters";
import { KanbanColumnManager } from "./kanban-column-manager";
import { SnoozeDialog } from "./snooze-dialog";

const DND_TYPE = "EMAIL_CARD";

interface DragItem {
  id: string;
  email: Email;
  fromColumn: string;
}

interface KanbanColumn {
  id: string;
  title: string;
  label: string;
  description?: string;
}

const DEFAULT_KANBAN_COLUMNS: KanbanColumn[] = [
  {
    id: "inbox",
    title: "Inbox",
    label: "",
    description: "New / triage",
  },
  {
    id: "todo",
    title: "To Do",
    label: "todo",
    description: "Planned tasks",
  },
  {
    id: "in-progress",
    title: "In Progress",
    label: "in-progress",
    description: "Being worked on",
  },
  {
    id: "done",
    title: "Done",
    label: "done",
    description: "Completed",
  },
  {
    id: "snoozed",
    title: "Snoozed",
    label: "snoozed",
    description: "Postponed",
  },
];

interface EmailKanbanProps {
  filters: EmailFilterValues;
  searchEmails?: Email[]; // Search results from UnifiedSearchBar
  onBackToEmail?: () => void;
}

interface EmailCardProps {
  email: Email;
  columnId: string;
  onCardClick: (emailId: string) => void;
}

function EmailCard({ email, columnId, onCardClick }: EmailCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: DND_TYPE,
    item: { id: email.id, email, fromColumn: columnId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <Card
      ref={drag}
      className={cn(
        "w-full cursor-move border bg-background p-2 shadow-sm transition-opacity will-change-transform md:p-3",
        isDragging ? "opacity-50" : "opacity-100"
      )}
      onClick={() => onCardClick(email.id)}
    >
      <div className="mb-1 flex items-center justify-between gap-1 md:gap-2">
        <span className="line-clamp-1 text-xs font-semibold md:text-sm">{email.subject}</span>
      </div>
      <div className="text-[10px] text-muted-foreground md:text-[11px]">
        <span className="line-clamp-1">From: {email.from}</span>
      </div>
      {email.preview && (
        <div className="mt-1 line-clamp-2 text-[10px] text-muted-foreground/80 md:text-xs">
          {email.preview}
        </div>
      )}
      {email.aiSummary && (
        <div className="mt-2 rounded-md border border-purple-200 bg-purple-50 p-2 dark:border-purple-800 dark:bg-purple-950/20">
          <div className="mb-1 flex items-start gap-1">
            <Sparkles className="mt-0.5 size-3 shrink-0 text-purple-500" />
            <span className="text-[9px] font-medium text-purple-700 dark:text-purple-400 md:text-[10px]">
              AI Summary
            </span>
          </div>
          <p className="line-clamp-2 text-[9px] text-purple-900/80 dark:text-purple-100/80 md:text-[10px]">
            {email.aiSummary}
          </p>
        </div>
      )}
      {email.snoozeUntil && columnId === "snoozed" && (
        <div className="mt-2">
          <SnoozeCountdown snoozeUntil={email.snoozeUntil} />
        </div>
      )}
      <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground md:text-[11px]">
        <span>{format(new Date(email.sentAt), "dd/MM HH:mm")}</span>
      </div>
    </Card>
  );
}

interface KanbanColumnComponentProps {
  column: KanbanColumn;
  emails: Email[];
  onCardClick: (emailId: string) => void;
  onMove: (emailId: string, fromColumn: string, toColumn: string) => void;
}

function KanbanColumnComponent({
  column,
  emails,
  onCardClick,
  onMove,
}: KanbanColumnComponentProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: DND_TYPE,
    drop: (item: DragItem) => {
      onMove(item.id, item.fromColumn, column.id);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const bgClass = isOver ? "bg-primary/10 border-primary" : "bg-muted/40";

  return (
    <div
      ref={drop}
      className={cn(
        "flex max-h-[calc(100vh-200px)] min-h-[400px] flex-col rounded-lg border p-2 transition-colors md:p-3",
        "min-w-[280px] flex-shrink-0 md:min-w-0",
        bgClass
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold">{column.title}</h3>
          {column.description ? (
            <p className="truncate text-xs text-muted-foreground">{column.description}</p>
          ) : null}
        </div>
        <Badge variant="secondary" className="shrink-0">
          {emails.length}
        </Badge>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {emails.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-muted-foreground/30 bg-background/40 p-4 text-xs text-muted-foreground">
            Drag emails here
          </div>
        ) : (
          emails.map((email) => (
            <EmailCard
              key={email.id}
              email={email}
              columnId={column.id}
              onCardClick={onCardClick}
            />
          ))
        )}
      </div>
    </div>
  );
}

export function EmailKanbanRefactored({
  filters,
  searchEmails,
  onBackToEmail,
}: EmailKanbanProps): JSX.Element {
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [pendingSnooze, setPendingSnooze] = useState<{
    emailId: string;
    fromColumn: string;
  } | null>(null);
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [kanbanColumns, setKanbanColumns] = useState<KanbanColumn[]>(DEFAULT_KANBAN_COLUMNS);

  const { toast } = useToast();
  const moveCardMutation = useMoveCard();
  const queryClient = useQueryClient();
  const { data: boardData, isLoading: isBoardLoading, refetch: refetchBoard } = useKanbanBoard();
  const createColumnMutation = useCreateColumn();
  const updateColumnMutation = useUpdateColumn();
  const deleteColumnMutation = useDeleteColumn();

  const {
    data: inboxData,
    isLoading: isInboxLoading,
    refetch: refetchInbox,
  } = useEmailsByFolder("inbox", 1, 50, filters);
  const {
    data: archiveData,
    isLoading: isArchiveLoading,
    refetch: refetchArchive,
  } = useEmailsByFolder("archive", 1, 50, filters);
  const {
    data: snoozedData,
    isLoading: isSnoozedLoading,
    refetch: refetchSnoozed,
  } = useEmailsByFolder("snoozed", 1, 50, filters);

  // Force refresh board on mount to get latest data
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["kanban", "board"] });
    refetchBoard();
  }, [queryClient, refetchBoard]);

  // Auto-refresh polling every 60 seconds for snoozed emails
  useEffect(() => {
    const intervalId = setInterval(() => {
      // Silently refetch snoozed emails to check for wake-ups
      refetchSnoozed();
      refetchInbox();
    }, 60000); // 60 seconds

    return () => clearInterval(intervalId);
  }, [refetchSnoozed, refetchInbox]);

  const isLoading =
    isInboxLoading || isArchiveLoading || isSnoozedLoading || isBoardLoading || !boardData;

  useEffect(() => {
    if (!boardData?.columns) {
      return;
    }

    const mapped: KanbanColumn[] = boardData.columns
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((col) => {
        const fallback = DEFAULT_KANBAN_COLUMNS.find((d) => d.id === col.id);
        return {
          id: col.id,
          title: col.title,
          // Use label from backend first, fallback to default, or use col.id as last resort
          label: (col as { label?: string }).label ?? col.id ?? fallback?.label ?? "",
          description: col.description,
        };
      });

    setKanbanColumns(mapped);
  }, [boardData]);

  let allEmails: Email[] = searchEmails || [
    ...(inboxData?.emails || []),
    ...(archiveData?.emails || []),
    ...(snoozedData?.emails || []),
  ];

  // Apply filters to search results if searching
  if (searchEmails && filters) {
    allEmails = [...searchEmails];

    // Apply read/unread filter
    if (filters.unread !== undefined) {
      allEmails = allEmails.filter((email) => email.isRead !== filters.unread);
    }

    // Apply starred filter
    if (filters.starred !== undefined) {
      allEmails = allEmails.filter((email) => email.isStarred === filters.starred);
    }

    // Apply has attachments filter
    if (filters.hasAttachments !== undefined) {
      allEmails = allEmails.filter((email) => email.hasAttachments === filters.hasAttachments);
    }

    // Apply from/sender filter
    if (filters.from?.trim()) {
      const fromLower = filters.from.toLowerCase();
      allEmails = allEmails.filter((email) => email.from.toLowerCase().includes(fromLower));
    }

    // Apply date range filter
    if (filters.startDate) {
      allEmails = allEmails.filter((email) => new Date(email.sentAt) >= filters.startDate!);
    }
    if (filters.endDate) {
      const endOfDay = new Date(filters.endDate);
      endOfDay.setHours(23, 59, 59, 999);
      allEmails = allEmails.filter((email) => new Date(email.sentAt) <= endOfDay);
    }
  }

  const getEmailsForColumn = (column: KanbanColumn): Email[] => {
    // Get emails from board cards FIRST (source of truth for Kanban positioning)
    if (boardData?.columns) {
      const boardColumn = boardData.columns.find((col) => col.id === column.id);
      if (boardColumn?.cards && boardColumn.cards.length > 0) {
        // Get emails from board cards - these are emails explicitly added to Kanban
        const emailsFromCards = boardColumn.cards
          .map((card) => allEmails.find((e) => e.id === card.emailId))
          .filter((e): e is Email => e !== undefined);

        // Return ONLY emails that are in the board cards (no fallback)
        // This ensures moved emails don't appear in multiple columns
        return emailsFromCards;
      }
    }

    // If no board cards exist for this column, show emails based on labels
    // This handles: 1) First load before any email is added to board
    //               2) New emails coming from Gmail with matching labels
    let emails: Email[] = [];

    if (column.id === "inbox") {
      // Inbox: emails WITHOUT any Kanban labels
      emails = allEmails.filter(
        (email) =>
          email.folder === "inbox" &&
          !email.labels?.includes("todo") &&
          !email.labels?.includes("in-progress") &&
          !email.labels?.includes("done") &&
          !email.labels?.includes("snoozed")
      );
    } else if (column.id === "snoozed") {
      emails = allEmails.filter(
        (email) => email.labels?.includes("snoozed") || !!email.snoozeUntil
      );
    } else {
      // Other columns: filter by label
      emails = allEmails.filter((email) => email.labels?.includes(column.label));
    }

    const sortKey = filters.sort ?? "newest";

    const sorted = [...emails].sort((a, b) => {
      if (sortKey === "sender-asc" || sortKey === "sender-desc") {
        const fromA = (a.from || "").toLowerCase();
        const fromB = (b.from || "").toLowerCase();
        const cmp = fromA.localeCompare(fromB);
        return sortKey === "sender-asc" ? cmp : -cmp;
      }

      const dateA = new Date(a.sentAt).getTime();
      const dateB = new Date(b.sentAt).getTime();
      return sortKey === "oldest" ? dateA - dateB : dateB - dateA;
    });

    return sorted;
  };

  const handleMove = (emailId: string, fromColumn: string, toColumn: string) => {
    if (fromColumn === toColumn) return;

    const email = allEmails.find((e) => e.id === emailId);
    if (!email) return;

    if (toColumn === "snoozed") {
      setPendingSnooze({ emailId, fromColumn });
      return;
    }

    // Use Kanban API to move card (will sync with Gmail if applicable)
    moveCardMutation.mutate(
      {
        emailId,
        fromColumn,
        toColumn,
        position: 0, // Add to top of column
      },
      {
        onSuccess: (data) => {
          // Refetch emails to get updated labels
          refetchInbox();
          refetchArchive();
          refetchSnoozed();
          refetchBoard();

          const targetColumn = kanbanColumns.find((c) => c.id === toColumn)?.title;
          const providerType = boardData?.providerType;

          let description = `Moved to ${targetColumn}`;
          if (providerType === "gmail" && data.synced) {
            description += " ✓ Gmail label synced";
          } else if (providerType === "database") {
            description += " ✓ Label saved locally";
          } else if (providerType === "imap") {
            description += " (tracked in board only)";
          }

          toast({
            title: "Email moved",
            description,
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to move email",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleRefresh = () => {
    refetchInbox();
    refetchArchive();
    refetchSnoozed();
    refetchBoard();
  };

  const handleSnoozeSuccess = () => {
    setPendingSnooze(null);
    refetchInbox();
    refetchArchive();
    refetchSnoozed();
  };

  const handleAddColumn = (column: Omit<KanbanColumn, "id">) => {
    const newColumnData = {
      id: column.label,
      title: column.title,
      description: column.description,
      position: kanbanColumns.length,
      label: column.label,
    };

    createColumnMutation.mutate(newColumnData, {
      onSuccess: () => {
        refetchBoard();
        setShowColumnManager(false);
      },
      onError: (error) => {
        console.error("Error creating column:", error);
      },
    });
  };

  const handleUpdateColumn = (id: string, updates: Partial<KanbanColumn>) => {
    const payload: Record<string, unknown> = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.label !== undefined) payload.label = updates.label;

    updateColumnMutation.mutate(
      { columnId: id, data: payload },
      {
        onSuccess: () => {
          refetchBoard();
        },
      }
    );
  };

  const handleDeleteColumn = (id: string) => {
    deleteColumnMutation.mutate(id, {
      onSuccess: () => {
        refetchBoard();
      },
    });
  };

  return (
    <div className="flex h-full min-h-[500px] flex-1 flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Email Kanban Board</h2>
          <p className="text-sm text-muted-foreground">
            Drag emails between columns to organize your workflow.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {boardData?.providerType && (
            <Badge
              variant={boardData.providerType === "gmail" ? "default" : "secondary"}
              className="text-xs"
            >
              {boardData.providerType === "gmail"
                ? "📧 Gmail"
                : boardData.providerType === "imap"
                  ? "📬 IMAP"
                  : "💾 Local"}
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowColumnManager(true)}>
            <Settings className="mr-2 size-4" />
            Manage Columns
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCcw className="mr-2 size-4" />
            Refresh
          </Button>
          {onBackToEmail && (
            <Button size="sm" onClick={onBackToEmail}>
              Back to email
            </Button>
          )}
        </div>
      </div>

      <DndProvider backend={HTML5Backend}>
        <div className="flex-1 overflow-x-auto pb-4">
          <div
            className="grid h-full min-h-[400px] gap-3"
            style={{
              gridTemplateColumns: `repeat(${kanbanColumns.length}, minmax(280px, 1fr))`,
              minWidth: `${kanbanColumns.length * 280}px`,
            }}
          >
            {isLoading ? (
              <div className="col-span-full flex items-center justify-center">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              kanbanColumns.map((column) => (
                <KanbanColumnComponent
                  key={column.id}
                  column={column}
                  emails={getEmailsForColumn(column)}
                  onCardClick={setSelectedEmailId}
                  onMove={handleMove}
                />
              ))
            )}
          </div>
        </div>
      </DndProvider>

      <Dialog
        open={!!selectedEmailId}
        onOpenChange={(open) => {
          if (!open) setSelectedEmailId(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden p-0 [&>button]:hidden">
          {selectedEmailId && (
            <EmailDetail
              emailId={selectedEmailId}
              onClose={() => setSelectedEmailId(null)}
              onDelete={() => {
                setSelectedEmailId(null);
                handleRefresh();
              }}
              onBack={() => setSelectedEmailId(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {pendingSnooze && (
        <SnoozeDialog
          emailId={pendingSnooze.emailId}
          open={true}
          onOpenChange={(open) => {
            if (!open) setPendingSnooze(null);
          }}
          onSuccess={handleSnoozeSuccess}
        />
      )}

      <KanbanColumnManager
        open={showColumnManager}
        onOpenChange={setShowColumnManager}
        columns={kanbanColumns}
        onAddColumn={handleAddColumn}
        onUpdateColumn={handleUpdateColumn}
        onDeleteColumn={handleDeleteColumn}
      />
    </div>
  );
}
