import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, RefreshCcw, Target } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useInfiniteEmailsByFolder, useUnsnoozeEmail } from "@/hooks/react-query/useEmails";
import { useKanbanBoard, useMoveCard } from "@/hooks/react-query/useKanban";
import { cn } from "@/lib/utils";
import { Email } from "@/services/email";

import { SnoozeDialog } from "./snooze-dialog";

const DND_TYPE = "EMAIL_CARD";

interface DragItem {
  id: string;
  from: string;
}

interface EmailKanbanProps {
  onBackToEmail?: () => void;
}

export function EmailKanban({ onBackToEmail }: EmailKanbanProps) {
  const queryClient = useQueryClient();
  const { data: boardData, isLoading: isBoardLoading, refetch: refetchBoard } = useKanbanBoard();

  // Fetch emails from multiple folders for Kanban view - use infinite query
  const {
    data: inboxData,
    fetchNextPage: fetchNextInbox,
    hasNextPage: hasNextInbox,
    isFetchingNextPage: isFetchingNextInbox,
    refetch: refetchInbox,
  } = useInfiniteEmailsByFolder("inbox", 50);
  const {
    data: snoozedData,
    fetchNextPage: fetchNextSnoozed,
    hasNextPage: hasNextSnoozed,
    isFetchingNextPage: isFetchingNextSnoozed,
    refetch: refetchSnoozed,
  } = useInfiniteEmailsByFolder("snoozed", 50);
  const {
    data: archivedData,
    fetchNextPage: fetchNextArchived,
    hasNextPage: hasNextArchived,
    isFetchingNextPage: isFetchingNextArchived,
    refetch: refetchArchived,
  } = useInfiniteEmailsByFolder("archive", 50);

  const moveCardMutation = useMoveCard();
  const unsnoozeEmailMutation = useUnsnoozeEmail();

  const [sortBy, setSortBy] = useState<"date" | "sender">("date");

  // Combine all emails from different folders for Kanban view
  // Deduplicate by email ID - only keep the latest version
  const emailMap = new Map<string, Email>();

  // Flatten infinite query pages into single arrays
  const inboxEmails = inboxData?.pages?.flatMap((page) => page.emails) || [];
  const archiveEmails = archivedData?.pages?.flatMap((page) => page.emails) || [];
  const snoozedEmails = snoozedData?.pages?.flatMap((page) => page.emails) || [];

  // Combine all emails
  const allEmailsSources = [...inboxEmails, ...archiveEmails, ...snoozedEmails];

  // Keep only unique emails by ID, preferring those with snooze status if snoozed
  allEmailsSources.forEach((email) => {
    const existing = emailMap.get(email.id);
    // Only add if:
    // 1. Doesn't exist yet, OR
    // 2. New email has snooze status and existing doesn't (more up-to-date)
    if (!existing || ((email.isSnoozed || email.snoozeUntil) && !existing.isSnoozed)) {
      emailMap.set(email.id, email);
    }
  });

  const allEmails = Array.from(emailMap.values());

  // State for snooze dialog
  const [pendingSnooze, setPendingSnooze] = useState<{
    emailId: string;
    fromColumn: string;
  } | null>(null);

  // Note: Board auto-initializes on backend when first accessed
  // 5 columns per requirements: Inbox, To Do, In Progress, Done, Snoozed

  // Build a map of which emails are in which columns
  const emailToColumnMap = new Map<string, string>();
  if (boardData) {
    boardData.columns.forEach((col) => {
      col.cards.forEach((card) => {
        emailToColumnMap.set(card.emailId, col.id);
      });
    });
  }

  const moveEmail = async (emailId: string, from: string, to: string) => {
    if (from === to) return;

    // Special handling for Snoozed column
    if (to === "snoozed" && from !== "snoozed") {
      // Moving TO Snoozed column: show dialog to ask when to snooze
      setPendingSnooze({ emailId, fromColumn: from });
    } else if (from === "snoozed" && to !== "snoozed") {
      // Moving FROM Snoozed column: unsnooze the email
      unsnoozeEmailMutation.mutate(emailId, {
        onSuccess: () => {
          // After unsnoozing, move the card
          moveCardMutation.mutate({
            emailId,
            fromColumn: from,
            toColumn: to,
            position: 0,
          });
        },
      });
    } else {
      // Normal move between other columns
      moveCardMutation.mutate({
        emailId,
        fromColumn: from,
        toColumn: to,
        position: 0,
      });
    }
  };

  const handleSnoozeSuccess = async () => {
    // Backend snooze API updates email, but we still need to update board columns
    if (pendingSnooze) {
      // Invalidate queries first
      await queryClient.invalidateQueries({ queryKey: ["emails-infinite"] });
      await queryClient.invalidateQueries({ queryKey: ["kanban"] });

      // Move card in board from source column to snoozed column
      await new Promise<void>((resolve) => {
        moveCardMutation.mutate(
          {
            emailId: pendingSnooze.emailId,
            fromColumn: pendingSnooze.fromColumn,
            toColumn: "snoozed",
            position: 0,
          },
          {
            onSuccess: async () => {
              // Refetch after board update
              await Promise.all([
                refetchBoard(),
                refetchInbox(),
                refetchSnoozed(),
                refetchArchived(),
              ]);
              setPendingSnooze(null);
              resolve();
            },
            onError: async () => {
              // Even if move fails, still refetch
              await Promise.all([
                refetchBoard(),
                refetchInbox(),
                refetchSnoozed(),
                refetchArchived(),
              ]);
              setPendingSnooze(null);
              resolve();
            },
          }
        );
      });
    } else {
      // If no pending snooze (direct snooze from email detail), just refetch
      await queryClient.invalidateQueries({ queryKey: ["emails-infinite"] });
      await queryClient.invalidateQueries({ queryKey: ["kanban"] });
      // If no pending snooze (direct snooze from email detail), just refetch
      await Promise.all([refetchBoard(), refetchInbox(), refetchSnoozed(), refetchArchived()]);
    }
  };

  const handleRefresh = () => {
    refetchBoard();
    refetchInbox();
    refetchSnoozed();
    refetchArchived();
  };

  if (isBoardLoading || !boardData) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Email Kanban Board</h2>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            Drag emails between columns to organize your workflow. AI summaries help quick
            decisions! <Target className="size-3.5" />
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={sortBy === "date" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("date")}
          >
            Sort by date
          </Button>
          <Button
            variant={sortBy === "sender" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("sender")}
          >
            Sort by sender
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={moveCardMutation.isPending}
          >
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
        <div className="grid h-full flex-1 grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {boardData.columns
            .sort((a, b) => a.position - b.position)
            .map((col) => {
              // Determine which folder and load more function to use
              let onLoadMore: (() => void) | undefined;
              let hasMore = false;
              let isLoadingMore = false;

              if (col.id === "inbox") {
                onLoadMore = () => hasNextInbox && fetchNextInbox();
                hasMore = hasNextInbox || false;
                isLoadingMore = isFetchingNextInbox;
              } else if (col.id === "snoozed") {
                onLoadMore = () => hasNextSnoozed && fetchNextSnoozed();
                hasMore = hasNextSnoozed || false;
                isLoadingMore = isFetchingNextSnoozed;
              } else if (col.id === "done") {
                onLoadMore = () => hasNextArchived && fetchNextArchived();
                hasMore = hasNextArchived || false;
                isLoadingMore = isFetchingNextArchived;
              }

              return (
                <KanbanColumn
                  key={col.id}
                  column={col}
                  emailToColumnMap={emailToColumnMap}
                  allInboxEmails={allEmails}
                  sortBy={sortBy}
                  onMoveEmail={moveEmail}
                  onLoadMore={onLoadMore}
                  hasMore={hasMore}
                  isLoadingMore={isLoadingMore}
                />
              );
            })}
        </div>
      </DndProvider>

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
    </div>
  );
}

interface KanbanColumnProps {
  column: {
    id: string;
    title: string;
    description?: string;
    color?: string;
    cards: Array<{ emailId: string; position: number; emailProvider?: string }>;
  };
  emailToColumnMap: Map<string, string>;
  allInboxEmails: Email[];
  sortBy: "date" | "sender";
  onMoveEmail: (emailId: string, from: string, to: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

function KanbanColumn({
  column,
  emailToColumnMap,
  allInboxEmails,
  sortBy,
  onMoveEmail,
  onLoadMore,
  hasMore,
  isLoadingMore,
}: KanbanColumnProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Get emails for this column
  let displayEmails: Email[] = [];

  if (column.id === "inbox") {
    // Inbox column: show ALL emails that haven't been moved to other columns
    // Exclude snoozed emails (they should only appear in Snoozed column)
    displayEmails = allInboxEmails.filter((email) => {
      // Priority 1: Always exclude snoozed emails from inbox
      if (email.isSnoozed || email.snoozeUntil || email.labels?.includes("snoozed")) return false;

      const assignedColumn = emailToColumnMap.get(email.id);
      // Show if: not assigned to any column OR explicitly in inbox column
      return !assignedColumn || assignedColumn === "inbox";
    });
  } else if (column.id === "snoozed") {
    // Snoozed column: Check BOTH labels AND snooze status
    displayEmails = allInboxEmails.filter((e) => {
      // Always show if email has snooze status OR snoozed label
      return e.isSnoozed === true || !!e.snoozeUntil || e.labels?.includes("snoozed");
    });
  } else {
    // Other columns: show only explicitly assigned emails, but exclude snoozed
    const emailIds = column.cards.map((card) => card.emailId);
    displayEmails = allInboxEmails.filter((e) => {
      // Priority 1: Never show snoozed emails in non-snoozed columns
      if (e.isSnoozed || e.snoozeUntil || e.labels?.includes("snoozed")) return false;
      // Priority 2: Check board mapping
      return emailIds.includes(e.id);
    });
  }

  // Apply sorting
  const sortedEmails = [...displayEmails].sort((a, b) => {
    if (sortBy === "sender") {
      const fromA = (a.from || "").toLowerCase();
      const fromB = (b.from || "").toLowerCase();
      return fromA.localeCompare(fromB);
    }
    // Default: sort by date (newest first)
    const timeA = new Date(a.sentAt).getTime();
    const timeB = new Date(b.sentAt).getTime();
    return timeB - timeA;
  });

  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: DND_TYPE,
      drop: (item: DragItem) => {
        onMoveEmail(item.id, item.from, column.id);
      },
      canDrop: (item: DragItem) => item.from !== column.id,
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [column.id, onMoveEmail]
  );

  // Combine refs for both drop and scroll
  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      (scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      drop(node);
    },
    [drop]
  );

  // Handle scroll to load more
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement || !onLoadMore || !hasMore || isLoadingMore) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

      // Load more when scrolled to 80% of content
      if (scrollPercentage > 0.8) {
        onLoadMore();
      }
    };

    scrollElement.addEventListener("scroll", handleScroll);
    return () => scrollElement.removeEventListener("scroll", handleScroll);
  }, [onLoadMore, hasMore, isLoadingMore]);

  const bgClass = isOver && canDrop ? "bg-primary/10 border-primary" : "bg-muted/40";

  return (
    <div
      className={cn(
        "flex max-h-[calc(100vh-200px)] min-h-[400px] flex-col rounded-lg border p-2 transition-colors md:p-3",
        "min-w-[280px] flex-shrink-0 md:min-w-0", // Mobile: fixed width with horizontal scroll, Desktop: flexible
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
          {displayEmails.length}
        </Badge>
      </div>

      <div ref={setRefs} className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {sortedEmails.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-muted-foreground/30 bg-background/40 p-4 text-xs text-muted-foreground">
            Drag emails here
          </div>
        ) : (
          <>
            {sortedEmails.map((email) => (
              <KanbanCard key={email.id} columnId={column.id} email={email} />
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

interface KanbanCardProps {
  columnId: string;
  email: Email;
}

function KanbanCard({ columnId, email }: KanbanCardProps) {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: DND_TYPE,
      item: { id: email.id, from: columnId } as DragItem,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [email.id, columnId]
  );

  return (
    <Card
      ref={drag}
      className={cn(
        "w-full cursor-move border bg-background p-2 shadow-sm transition-opacity will-change-transform md:p-3",
        isDragging ? "opacity-50" : "opacity-100"
      )}
    >
      <div className="mb-1 flex items-center justify-between gap-1 md:gap-2">
        <span className="line-clamp-1 text-xs font-semibold md:text-sm">{email.subject}</span>
        <div className="flex shrink-0 items-center gap-0.5 md:gap-1">
          {email.isStarred && (
            <Badge variant="outline" className="h-4 px-1 text-xs md:h-5 md:px-2">
              ★
            </Badge>
          )}
          {email.isSnoozed && (
            <Badge variant="secondary" className="h-4 px-1 text-[10px] md:h-5 md:px-2 md:text-xs">
              Snoozed
            </Badge>
          )}
        </div>
      </div>
      <p className="line-clamp-2 text-[11px] text-muted-foreground md:text-xs">
        {email.preview ?? ""}
      </p>
      <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground md:mt-2 md:text-[11px]">
        <span className="line-clamp-1">From: {email.from}</span>
        <span>{format(new Date(email.sentAt), "dd/MM HH:mm")}</span>
      </div>
      {email.isSnoozed && email.snoozeUntil && (
        <div className="mt-1 text-[10px] text-orange-600">
          Until: {format(new Date(email.snoozeUntil), "dd/MM HH:mm")}
        </div>
      )}
    </Card>
  );
}
