import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, RefreshCcw, Settings, Sparkles } from "lucide-react";
import type { JSX } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import { SnoozeCountdown } from "@/components/snooze-countdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useInfiniteEmailsByFolder } from "@/hooks/react-query/use-emails";
import {
  useCreateColumn,
  useDeleteColumn,
  useKanbanBoard,
  useMoveCard,
  useUpdateColumn,
} from "@/hooks/react-query/use-kanban";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Email } from "@/types/email";

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
  searchEmails?: Email[];
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
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

function KanbanColumnComponent({
  column,
  emails,
  onCardClick,
  onMove,
  onLoadMore,
  hasMore,
  isLoadingMore,
}: KanbanColumnComponentProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: DND_TYPE,
    drop: (item: DragItem) => {
      onMove(item.id, item.fromColumn, column.id);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      (scrollRef as unknown as React.MutableRefObject<HTMLDivElement | null>).current = node;
      drop(node);
    },
    [drop]
  );

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement || !onLoadMore || !hasMore || isLoadingMore) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

      if (scrollPercentage > 0.8) {
        onLoadMore();
      }
    };

    scrollElement.addEventListener("scroll", handleScroll);
    return () => scrollElement.removeEventListener("scroll", handleScroll);
  }, [onLoadMore, hasMore, isLoadingMore]);

  const bgClass = isOver ? "bg-primary/10 border-primary" : "bg-muted/40";

  return (
    <div
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

      <div ref={setRefs} className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {emails.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-muted-foreground/30 bg-background/40 p-4 text-xs text-muted-foreground">
            Drag emails here
          </div>
        ) : (
          <>
            {emails.map((email) => (
              <EmailCard
                key={email.id}
                email={email}
                columnId={column.id}
                onCardClick={onCardClick}
              />
            ))}
            {isLoadingMore && (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
                <span className="ml-2 text-xs text-muted-foreground">Loading more...</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function EmailKanban({
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
    fetchNextPage: fetchNextInbox,
    hasNextPage: hasNextInbox,
    isFetchingNextPage: isFetchingNextInbox,
    refetch: refetchInbox,
  } = useInfiniteEmailsByFolder("inbox", 50, filters);
  const {
    data: archiveData,
    isLoading: isArchiveLoading,
    fetchNextPage: fetchNextArchive,
    hasNextPage: hasNextArchive,
    isFetchingNextPage: isFetchingNextArchive,
    refetch: refetchArchive,
  } = useInfiniteEmailsByFolder("archive", 50, filters);
  const {
    data: snoozedData,
    isLoading: isSnoozedLoading,
    fetchNextPage: fetchNextSnoozed,
    hasNextPage: hasNextSnoozed,
    isFetchingNextPage: isFetchingNextSnoozed,
    refetch: refetchSnoozed,
  } = useInfiniteEmailsByFolder("snoozed", 50, filters);

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["kanban", "board"] });
    refetchBoard();
  }, [queryClient, refetchBoard]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      refetchSnoozed();
      refetchInbox();
    }, 60000);

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

          label: (col as { label?: string }).label ?? col.id ?? fallback?.label ?? "",
          description: col.description,
        };
      });

    setKanbanColumns(mapped);
  }, [boardData]);

  const inboxEmails = inboxData?.pages?.flatMap((page) => page.emails) || [];
  const archiveEmails = archiveData?.pages?.flatMap((page) => page.emails) || [];
  const snoozedEmails = snoozedData?.pages?.flatMap((page) => page.emails) || [];

  const emailMap = new Map<string, Email>();
  [...inboxEmails, ...archiveEmails, ...snoozedEmails].forEach((email) => {
    const existing = emailMap.get(email.id);

    if (!existing || ((email.isSnoozed || email.snoozeUntil) && !existing.isSnoozed)) {
      emailMap.set(email.id, email);
    }
  });

  let allEmails: Email[] = searchEmails || Array.from(emailMap.values());

  if (searchEmails && filters) {
    allEmails = [...searchEmails];

    if (filters.unread !== undefined) {
      allEmails = allEmails.filter((email) => email.isRead !== filters.unread);
    }

    if (filters.starred !== undefined) {
      allEmails = allEmails.filter((email) => email.isStarred === filters.starred);
    }

    if (filters.hasAttachments !== undefined) {
      allEmails = allEmails.filter((email) => email.hasAttachments === filters.hasAttachments);
    }

    if (filters.from?.trim()) {
      const fromLower = filters.from.toLowerCase();
      allEmails = allEmails.filter((email) => email.from.toLowerCase().includes(fromLower));
    }

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
    if (boardData?.columns) {
      const boardColumn = boardData.columns.find((col) => col.id === column.id);
      if (boardColumn?.cards && boardColumn.cards.length > 0) {
        const emailsFromCards = boardColumn.cards
          .map((card) => allEmails.find((e) => e.id === card.emailId))
          .filter((e): e is Email => e !== undefined);

        return emailsFromCards;
      }
    }

    let emails: Email[] = [];

    if (column.id === "inbox") {
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
        (email) =>
          email.labels?.includes("snoozed") || email.isSnoozed === true || !!email.snoozeUntil
      );
    } else {
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

    moveCardMutation.mutate(
      {
        emailId,
        fromColumn,
        toColumn,
        position: 0,
      },
      {
        onSuccess: (data) => {
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

  const handleSnoozeSuccess = async () => {
    setPendingSnooze(null);

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["emails-infinite", "inbox"] }),
      queryClient.invalidateQueries({ queryKey: ["emails-infinite", "snoozed"] }),
      queryClient.invalidateQueries({ queryKey: ["emails-infinite", "archive"] }),
      queryClient.invalidateQueries({ queryKey: ["kanban", "board"] }),
    ]);

    refetchInbox();
    refetchArchive();
    refetchSnoozed();
    refetchBoard();
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
              kanbanColumns.map((column) => {
                let onLoadMore: (() => void) | undefined;
                let hasMore = false;
                let isLoadingMore = false;

                if (column.id === "inbox") {
                  onLoadMore = () => hasNextInbox && fetchNextInbox();
                  hasMore = hasNextInbox || false;
                  isLoadingMore = isFetchingNextInbox;
                } else if (column.id === "snoozed") {
                  onLoadMore = () => hasNextSnoozed && fetchNextSnoozed();
                  hasMore = hasNextSnoozed || false;
                  isLoadingMore = isFetchingNextSnoozed;
                } else if (column.label === "done" || column.label === "archive") {
                  onLoadMore = () => hasNextArchive && fetchNextArchive();
                  hasMore = hasNextArchive || false;
                  isLoadingMore = isFetchingNextArchive;
                }

                return (
                  <KanbanColumnComponent
                    key={column.id}
                    column={column}
                    emails={getEmailsForColumn(column)}
                    onCardClick={setSelectedEmailId}
                    onMove={handleMove}
                    onLoadMore={onLoadMore}
                    hasMore={hasMore}
                    isLoadingMore={isLoadingMore}
                  />
                );
              })
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
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto p-0 [&>button]:hidden">
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
