import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useEmailsByFolder, useUpdateEmailLabels } from "@/hooks/react-query/useEmails";
import { useKanbanBoard, useCreateColumn, useUpdateColumn, useDeleteColumn } from "@/hooks/react-query/useKanban";
import { useToast } from "@/hooks/use-toast";
import { Email } from "@/services/email";
import { EmailFilterValues } from "./email-filters";
import { EmailDetail } from "./email-detail";
import { SnoozeDialog } from "./snooze-dialog";
import { KanbanColumnManager } from "./kanban-column-manager";
import { format } from "date-fns";
import { Loader2, RefreshCcw, Settings } from "lucide-react";
import type { JSX } from "react";
import { useEffect, useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

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
        isDragging ? "opacity-50" : "opacity-100",
      )}
      onClick={() => onCardClick(email.id)}
    >
      <div className="mb-1 flex items-center justify-between gap-1 md:gap-2">
        <span className="line-clamp-1 text-xs font-semibold md:text-sm">{email.subject}</span>
      </div>
      <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground md:mt-2 md:text-[11px]">
        <span className="line-clamp-1">From: {email.from}</span>
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

function KanbanColumnComponent({ column, emails, onCardClick, onMove }: KanbanColumnComponentProps) {
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
        "flex min-h-[400px] max-h-[calc(100vh-200px)] flex-col rounded-lg border p-2 transition-colors md:p-3",
        "min-w-[280px] flex-shrink-0 md:min-w-0",
        bgClass,
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold">{column.title}</h3>
          {column.description ? (
            <p className="truncate text-xs text-muted-foreground">{column.description}</p>
          ) : null}
        </div>
        <Badge variant="secondary" className="flex-shrink-0">
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
            <EmailCard key={email.id} email={email} columnId={column.id} onCardClick={onCardClick} />
          ))
        )}
      </div>
    </div>
  );
}

export function EmailKanbanRefactored({ filters, searchEmails, onBackToEmail }: EmailKanbanProps): JSX.Element {
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [pendingSnooze, setPendingSnooze] = useState<{
    emailId: string;
    fromColumn: string;
  } | null>(null);
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [kanbanColumns, setKanbanColumns] = useState<KanbanColumn[]>(DEFAULT_KANBAN_COLUMNS);

  const { toast } = useToast();
  const updateLabelsMutation = useUpdateEmailLabels();
  const { data: boardData, isLoading: isBoardLoading, refetch: refetchBoard } = useKanbanBoard();
  const createColumnMutation = useCreateColumn();
  const updateColumnMutation = useUpdateColumn();
  const deleteColumnMutation = useDeleteColumn();

  const {
    data: inboxData,
    isLoading: isInboxLoading,
    refetch: refetchInbox,
  } = useEmailsByFolder("inbox", 1, 500, filters);
  const {
    data: archiveData,
    isLoading: isArchiveLoading,
    refetch: refetchArchive,
  } = useEmailsByFolder("archive", 1, 500, filters);
  const {
    data: snoozedData,
    isLoading: isSnoozedLoading,
    refetch: refetchSnoozed,
  } = useEmailsByFolder("snoozed", 1, 500, filters);

  const isLoading =
    isInboxLoading || isArchiveLoading || isSnoozedLoading || isBoardLoading || !boardData;

  // Use search results if provided, otherwise use folder data
  const displayInboxEmails = searchEmails || inboxData?.emails || [];
  const displayArchiveEmails = searchEmails ? searchEmails.filter(e => e.folder === 'archive') : archiveData?.emails || [];
  const displaySnoozedEmails = searchEmails ? searchEmails.filter(e => e.folder === 'snoozed') : snoozedData?.emails || [];

  useEffect(() => {
    if (!boardData?.columns) return;

    const mapped: KanbanColumn[] = boardData.columns
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((col) => {
        const fallback = DEFAULT_KANBAN_COLUMNS.find((d) => d.id === col.id);
        return {
          id: col.id,
          title: col.title,
          label: (col as any).label ?? fallback?.label ?? "",
          description: col.description,
        };
      });

    setKanbanColumns(mapped);
  }, [boardData]);

  const allEmails: Email[] = searchEmails || [
    ...(inboxData?.emails || []),
    ...(archiveData?.emails || []),
    ...(snoozedData?.emails || []),
  ];

  const getEmailsForColumn = (column: KanbanColumn): Email[] => {
    let emails: Email[] = [];

    if (column.id === "inbox") {
      emails = allEmails.filter(
        (email) =>
          email.folder === "inbox" &&
          !email.labels?.includes("todo") &&
          !email.labels?.includes("in-progress") &&
          !email.labels?.includes("done") &&
          !email.labels?.includes("snoozed"),
      );
    } else if (column.id === "snoozed") {
      emails = allEmails.filter(
        (email) => email.labels?.includes("snoozed") || !!email.snoozeUntil,
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

    const currentLabels = email.labels || [];
    const labelsToRemove = kanbanColumns.map((c) => c.label).filter((l) => l !== "");
    const newLabels = currentLabels.filter((label) => !labelsToRemove.includes(label));

    if (toColumn !== "inbox") {
      const targetColumn = kanbanColumns.find((c) => c.id === toColumn);
      if (targetColumn?.label) {
        newLabels.push(targetColumn.label);
      }
    }

    updateLabelsMutation.mutate(
      { emailId, labels: newLabels },
      {
        onSuccess: () => {
          toast({
            title: "Email moved",
            description: `Moved to ${kanbanColumns.find((c) => c.id === toColumn)?.title}`,
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to move email",
            variant: "destructive",
          });
        },
      },
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
    createColumnMutation.mutate({
      id: column.label,
      title: column.title,
      description: column.description,
      position: kanbanColumns.length,
      label: column.label,
    });
  };

  const handleUpdateColumn = (id: string, updates: Partial<KanbanColumn>) => {
    const payload: any = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.label !== undefined) payload.label = updates.label;

    updateColumnMutation.mutate({ columnId: id, data: payload });
  };

  const handleDeleteColumn = (id: string) => {
    deleteColumnMutation.mutate(id);
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
        <div className="grid h-full min-h-[400px] flex-1 grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-5">
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
