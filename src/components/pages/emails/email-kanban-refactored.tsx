import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useEmailsByFolder, useUpdateEmailLabels } from "@/hooks/react-query/useEmails";
import { Email } from "@/services/email";
import { format } from "date-fns";
import { Calendar, Loader2, RefreshCcw, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { EmailDetail } from "./email-detail";
import { SnoozeDialog } from "./snooze-dialog";
import { KanbanColumnManager } from "./kanban-column-manager";
import { useToast } from "@/hooks/use-toast";

const DND_TYPE = "EMAIL_CARD";

interface DragItem {
  id: string;
  email: Email;
  fromColumn: string;
}

interface KanbanColumn {
  id: string;
  title: string;
  label: string; // Email label for filtering
  description?: string;
}

// Kanban columns based on email labels - can be extended
const DEFAULT_KANBAN_COLUMNS: KanbanColumn[] = [
  { 
    id: 'inbox', 
    title: 'Inbox', 
    label: '', // No label = inbox
    description: 'New / triage'
  },
  { 
    id: 'todo', 
    title: 'To Do', 
    label: 'todo',
    description: 'Planned tasks'
  },
  { 
    id: 'in-progress', 
    title: 'In Progress', 
    label: 'in-progress',
    description: 'Being worked on'
  },
  { 
    id: 'done', 
    title: 'Done', 
    label: 'done',
    description: 'Completed'
  },
  { 
    id: 'snoozed', 
    title: 'Snoozed', 
    label: 'snoozed',
    description: 'Postponed'
  },
];

const STORAGE_KEY = 'kanban-columns';

interface EmailKanbanProps {
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
        <div className="flex flex-shrink-0 items-center gap-0.5 md:gap-1">
          {email.isStarred && <Badge variant="outline" className="h-4 px-1 text-xs md:h-5 md:px-2">★</Badge>}
          {email.isSnoozed && (
            <Badge variant="secondary" className="h-4 px-1 text-[10px] md:h-5 md:px-2 md:text-xs">
              Snoozed
            </Badge>
          )}
        </div>
      </div>
      <p className="line-clamp-2 text-[11px] text-muted-foreground md:text-xs">{email.preview ?? ""}</p>
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
        "min-w-[280px] flex-shrink-0 md:min-w-0", // Mobile: fixed width with horizontal scroll, Desktop: flexible
        bgClass
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold">{column.title}</h3>
          {column.description ? <p className="truncate text-xs text-muted-foreground">{column.description}</p> : null}
        </div>
        <Badge variant="secondary" className="flex-shrink-0">{emails.length}</Badge>
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

export function EmailKanbanRefactored({ onBackToEmail }: EmailKanbanProps) {
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [pendingSnooze, setPendingSnooze] = useState<{
    emailId: string;
    fromColumn: string;
  } | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [kanbanColumns, setKanbanColumns] = useState<KanbanColumn[]>(() => {
    // Load columns from localStorage or use defaults
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_KANBAN_COLUMNS;
    } catch {
      return DEFAULT_KANBAN_COLUMNS;
    }
  });
  
  const { toast } = useToast();
  const updateLabelsMutation = useUpdateEmailLabels();
  
  // Save columns to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(kanbanColumns));
  }, [kanbanColumns]);
  
  // Fetch ALL emails by using large limit (500 should cover most cases)
  // In production, you might want to implement proper pagination or infinite scroll
  const { data: inboxData, isLoading: isInboxLoading, refetch: refetchInbox } = useEmailsByFolder("inbox", 1, 500);
  const { data: archiveData, isLoading: isArchiveLoading, refetch: refetchArchive } = useEmailsByFolder("archive", 1, 500);
  const { data: snoozedData, isLoading: isSnoozedLoading, refetch: refetchSnoozed } = useEmailsByFolder("snoozed", 1, 500);
  
  const isLoading = isInboxLoading || isArchiveLoading || isSnoozedLoading;
  
  // Combine all emails from different folders
  const allEmails = [
    ...(inboxData?.emails || []),
    ...(archiveData?.emails || []),
    ...(snoozedData?.emails || []),
  ];

  // Group emails by column based on labels with sorting
  const getEmailsForColumn = (column: KanbanColumn): Email[] => {
    let emails: Email[] = [];
    
    if (column.id === 'inbox') {
      // Inbox: no special labels, not archived, not snoozed
      emails = allEmails.filter(
        email => 
          email.folder === 'inbox' &&
          !email.labels?.includes('todo') &&
          !email.labels?.includes('in-progress') &&
          !email.labels?.includes('done') &&
          !email.labels?.includes('snoozed')
      );
    } else if (column.id === 'snoozed') {
      // Snoozed: has snoozed label or snoozeUntil date
      emails = allEmails.filter(
        email => email.labels?.includes('snoozed') || email.snoozeUntil
      );
    } else {
      // Other columns: filter by label
      emails = allEmails.filter(email => email.labels?.includes(column.label));
    }
    
    // Apply sorting
    return emails.sort((a, b) => {
      const dateA = new Date(a.sentAt).getTime();
      const dateB = new Date(b.sentAt).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
  };

  const handleMove = async (emailId: string, fromColumn: string, toColumn: string) => {
    if (fromColumn === toColumn) return;
    
    const email = allEmails.find(e => e.id === emailId);
    if (!email) return;

    // Special handling for Snoozed column
    if (toColumn === 'snoozed') {
      // Show snooze dialog to ask for time
      setPendingSnooze({ emailId, fromColumn });
      return;
    }

    // Calculate new labels based on column
    const currentLabels = email.labels || [];
    const labelsToRemove = kanbanColumns.map(c => c.label).filter(l => l !== '');
    const newLabels = currentLabels.filter(label => !labelsToRemove.includes(label));
    
    // Add new column label if not inbox
    if (toColumn !== 'inbox') {
      const targetColumn = kanbanColumns.find(c => c.id === toColumn);
      if (targetColumn && targetColumn.label) {
        newLabels.push(targetColumn.label);
      }
    }

    updateLabelsMutation.mutate(
      { emailId, labels: newLabels },
      {
        onSuccess: async () => {
          toast({
            title: 'Email moved',
            description: `Moved to ${kanbanColumns.find(c => c.id === toColumn)?.title}`,
          });
        },
        onError: () => {
          toast({
            title: 'Error',
            description: 'Failed to move email',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleRefresh = () => {
    refetchInbox();
    refetchArchive();
    refetchSnoozed();
  };

  const handleSnoozeSuccess = async () => {
    // Backend automatically adds 'snoozed' label, just refetch
    setPendingSnooze(null);
  };

  const handleAddColumn = (column: Omit<KanbanColumn, 'id'>) => {
    const newColumn: KanbanColumn = {
      ...column,
      id: column.label, // Use label as ID for custom columns
    };
    setKanbanColumns([...kanbanColumns, newColumn]);
    toast({
      title: 'Column added',
      description: `"${column.title}" column has been added to your board.`,
    });
  };

  const handleUpdateColumn = (id: string, updates: Partial<KanbanColumn>) => {
    setKanbanColumns(
      kanbanColumns.map((col) => (col.id === id ? { ...col, ...updates } : col))
    );
    toast({
      title: 'Column updated',
      description: 'Column has been updated successfully.',
    });
  };

  const handleDeleteColumn = (id: string) => {
    setKanbanColumns(kanbanColumns.filter((col) => col.id !== id));
    toast({
      title: 'Column deleted',
      description: 'Column has been removed from your board.',
    });
  };

  if (isLoading) {
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
          <p className="text-sm text-muted-foreground">
            Drag emails between columns to organize your workflow. 🎯
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowColumnManager(true)}
          >
            <Settings className="mr-2 size-4" />
            Manage Columns
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
          >
            <Calendar className="mr-2 size-4" />
            {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
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
        <div className="grid h-full flex-1 grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {kanbanColumns.map((column) => (
            <KanbanColumnComponent
              key={column.id}
              column={column}
              emails={getEmailsForColumn(column)}
              onCardClick={setSelectedEmailId}
              onMove={handleMove}
            />
          ))}
        </div>
      </DndProvider>

      {/* Email Detail Dialog */}
      <Dialog open={!!selectedEmailId} onOpenChange={(open) => !open && setSelectedEmailId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 [&>button]:hidden">
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

      {/* Snooze Dialog */}
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

      {/* Column Manager Dialog */}
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
