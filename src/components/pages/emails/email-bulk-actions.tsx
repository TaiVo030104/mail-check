import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, MailOpen, MailX, Star, StarOff, Trash2, X } from 'lucide-react';

interface EmailBulkActionsProps {
  selectedCount: number;
  onClearSelection: () => void;
  onDeleteSelected: () => void;
  onMarkRead: () => void;
  onMarkUnread: () => void;
  onStarSelected: () => void;
  onUnstarSelected: () => void;
  isDeleting?: boolean;
  isMarking?: boolean;
  isStarring?: boolean;
}

export function EmailBulkActions({
  selectedCount,
  onClearSelection,
  onDeleteSelected,
  onMarkRead,
  onMarkUnread,
  onStarSelected,
  onUnstarSelected,
  isDeleting = false,
  isMarking = false,
  isStarring = false,
}: EmailBulkActionsProps) {
  if (selectedCount === 0) {
    return null;
  }

  const isBusy = isDeleting || isMarking || isStarring;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-t bg-muted/30 px-3 py-2.5 text-sm md:px-4">
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="text-xs">
          {selectedCount} selected
        </Badge>
        <Button variant="ghost" size="sm" onClick={onClearSelection} disabled={isBusy} className="gap-1">
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="destructive"
          size="sm"
          className="gap-1"
          onClick={onDeleteSelected}
          disabled={isDeleting}
        >
          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          Delete
        </Button>

        <Separator orientation="vertical" className="hidden h-6 md:block" />

        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={onMarkRead}
          disabled={isMarking}
        >
          <MailOpen className="h-3.5 w-3.5" />
          Mark read
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={onMarkUnread}
          disabled={isMarking}
        >
          <MailX className="h-3.5 w-3.5" />
          Mark unread
        </Button>

        <Separator orientation="vertical" className="hidden h-6 md:block" />

        <Button
          variant="secondary"
          size="sm"
          className="gap-1"
          onClick={onStarSelected}
          disabled={isStarring}
        >
          <Star className="h-3.5 w-3.5" />
          Star
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="gap-1"
          onClick={onUnstarSelected}
          disabled={isStarring}
        >
          <StarOff className="h-3.5 w-3.5" />
          Unstar
        </Button>
      </div>
    </div>
  );
}
