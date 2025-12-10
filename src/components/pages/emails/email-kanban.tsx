import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useEmailsByFolder } from "@/hooks/react-query/useEmails";
import { Email } from "@/services/email";
import { format } from "date-fns";
import { Loader2, MoveRight, RefreshCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

type KanbanColumnId = "inbox" | "todo" | "in-progress" | "in-review" | "done";

const KANBAN_COLUMNS: { id: KanbanColumnId; title: string; description?: string }[] = [
  { id: "inbox", title: "Inbox", description: "New / triage" },
  { id: "todo", title: "To Do", description: "Planned tasks" },
  { id: "in-progress", title: "In Progress", description: "Being worked on" },
  { id: "in-review", title: "In Review", description: "Waiting for review" },
  { id: "done", title: "Done", description: "Completed" },
];

const STORAGE_KEY = "email-kanban-board";
const DND_TYPE = "EMAIL_CARD";

type KanbanBoardState = Record<KanbanColumnId, Email[]>;

interface DragItem {
  id: string;
  from: KanbanColumnId;
}

function loadBoardFromStorage(): KanbanBoardState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as KanbanBoardState;
  } catch {
    return null;
  }
}

function saveBoardToStorage(board: KanbanBoardState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
  } catch {
    // ignore
  }
}

interface EmailKanbanProps {
  onBackToEmail?: () => void;
}

export function EmailKanban({ onBackToEmail }: EmailKanbanProps) {
  const { data, isLoading, refetch } = useEmailsByFolder("inbox", 1, 100);
  const [board, setBoard] = useState<KanbanBoardState | null>(null);

  const inboxEmails = useMemo(() => data?.emails ?? [], [data]);

  // Initialize board from storage or inbox fetch (run once until board is set)
  useEffect(() => {
    if (board) return;

    const stored = loadBoardFromStorage();
    if (stored) {
      setBoard(stored);
      return;
    }

    if (inboxEmails.length) {
      const initial: KanbanBoardState = {
        inbox: inboxEmails,
        todo: [],
        "in-progress": [],
        "in-review": [],
        done: [],
      };
      setBoard(initial);
      saveBoardToStorage(initial);
    }
  }, [board, inboxEmails]);

  // Persist board whenever it changes
  useEffect(() => {
    if (board) saveBoardToStorage(board);
  }, [board]);

  const moveEmail = (emailId: string, from: KanbanColumnId, to: KanbanColumnId) => {
    if (!board || from === to) return;
    setBoard((prev) => {
      if (!prev) return prev;
      const email = prev[from].find((e) => e.id === emailId);
      if (!email) return prev;

      return {
        ...prev,
        [from]: prev[from].filter((e) => e.id !== emailId),
        [to]: [email, ...prev[to]],
      };
    });
  };

  const resetBoard = () => {
    if (!inboxEmails.length) return;
    const fresh: KanbanBoardState = {
      inbox: inboxEmails,
      todo: [],
      "in-progress": [],
      "in-review": [],
      done: [],
    };
    setBoard(fresh);
    saveBoardToStorage(fresh);
  };

  if (isLoading && !board) {
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
          <h2 className="text-xl font-semibold">Email Kanban</h2>
          <p className="text-sm text-muted-foreground">
            Drag and drop emails across columns to manage your workflow.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCcw className="mr-2 size-4" />
            Refresh inbox
          </Button>
          <Button variant="outline" size="sm" onClick={resetBoard}>
            <MoveRight className="mr-2 size-4" />
            Reset board
          </Button>
          {onBackToEmail && (
            <Button size="sm" onClick={onBackToEmail}>
              Back to email
            </Button>
          )}
        </div>
      </div>

      {!board ? (
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          No data to display.
        </div>
      ) : (
        <DndProvider backend={HTML5Backend}>
          <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {KANBAN_COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                columnId={col.id}
                title={col.title}
                description={col.description}
                emails={board[col.id]}
                onDrop={(item) => moveEmail(item.id, item.from, col.id)}
              />
            ))}
          </div>
        </DndProvider>
      )}
    </div>
  );
}

interface KanbanColumnProps {
  columnId: KanbanColumnId;
  title: string;
  description?: string;
  emails: Email[];
  onDrop: (item: DragItem) => void;
}

function KanbanColumn({ columnId, title, description, emails, onDrop }: KanbanColumnProps) {
  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: DND_TYPE,
      drop: (item: DragItem) => onDrop(item),
      canDrop: (item: DragItem) => item.from !== columnId,
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [columnId, onDrop]
  );

  const bgClass = isOver && canDrop ? "bg-primary/10 border-primary" : "bg-muted/40";

  return (
    <div
      ref={drop}
      className={cn("flex min-h-[240px] flex-col rounded-lg border p-3 transition-colors", bgClass)}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        </div>
        <Badge variant="secondary">{emails.length}</Badge>
      </div>

      <div className="flex flex-1 flex-col gap-2">
        {emails.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-muted-foreground/30 bg-background/40 p-4 text-xs text-muted-foreground">
            Drag emails here
          </div>
        ) : (
          emails.map((email) => <KanbanCard key={email.id} columnId={columnId} email={email} />)
        )}
      </div>
    </div>
  );
}

interface KanbanCardProps {
  columnId: KanbanColumnId;
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
        "w-full cursor-move border bg-background p-3 shadow-sm transition-opacity will-change-transform",
        isDragging ? "opacity-50" : "opacity-100"
      )}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="line-clamp-1 text-sm font-semibold">{email.subject}</span>
        {email.isStarred ? <Badge variant="outline">★</Badge> : null}
      </div>
      <p className="line-clamp-2 text-xs text-muted-foreground">{email.preview ?? ""}</p>
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="line-clamp-1">From: {email.from}</span>
        <span>{format(new Date(email.sentAt), "dd/MM HH:mm")}</span>
      </div>
    </Card>
  );
}
