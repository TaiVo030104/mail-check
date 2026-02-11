import { useVirtualizer } from "@tanstack/react-virtual";
import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Paperclip,
  Star,
} from "lucide-react";
import { memo, useEffect, useMemo, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState, LoadingState } from "@/components/ui/loading-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEmailsByFolder } from "@/hooks/react-query/use-emails";
import { cn } from "@/lib/utils";
import type { Email } from "@/types/email";

import { EmailFilterValues } from "./email-filters";

interface EmailListProps {
  folder: string;
  selectedEmailId: string | null;
  onSelectEmail: (id: string) => void;
  page?: number;
  pageSize?: number;
  filters?: EmailFilterValues;
  searchEmails?: Email[];
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  selectedEmailIds?: string[];
  onToggleEmailSelection?: (id: string) => void;
  onSelectPageEmails?: (emailIds: string[], selected: boolean) => void;
  onSelectAllMatching?: () => void;
  isAllMatchingSelected?: boolean;
  isSelectAllLoading?: boolean;
  allMatchingCount?: number | null;
}

export const EmailList = memo(function EmailList({
  folder,
  selectedEmailId,
  onSelectEmail,
  page = 1,
  pageSize = 25,
  filters,
  searchEmails,
  onPageChange,
  onPageSizeChange,
  selectedEmailIds = [],
  onToggleEmailSelection,
  onSelectPageEmails,
  onSelectAllMatching,
  isAllMatchingSelected = false,
  isSelectAllLoading = false,
  allMatchingCount = null,
}: EmailListProps) {
  const { data, isLoading } = useEmailsByFolder(folder, page, pageSize, filters);

  let displayEmails = searchEmails || data?.emails || [];

  if (searchEmails && filters) {
    displayEmails = [...searchEmails];

    if (filters.unread !== undefined) {
      displayEmails = displayEmails.filter((email) => email.isRead !== filters.unread);
    }

    if (filters.starred !== undefined) {
      displayEmails = displayEmails.filter((email) => email.isStarred === filters.starred);
    }

    if (filters.hasAttachments !== undefined) {
      displayEmails = displayEmails.filter(
        (email) => email.hasAttachments === filters.hasAttachments
      );
    }

    if (filters.from?.trim()) {
      const fromLower = filters.from.toLowerCase();
      displayEmails = displayEmails.filter((email) => email.from.toLowerCase().includes(fromLower));
    }

    if (filters.startDate) {
      displayEmails = displayEmails.filter((email) => new Date(email.sentAt) >= filters.startDate!);
    }
    if (filters.endDate) {
      const endOfDay = new Date(filters.endDate);
      endOfDay.setHours(23, 59, 59, 999);
      displayEmails = displayEmails.filter((email) => new Date(email.sentAt) <= endOfDay);
    }

    if (filters.sort) {
      displayEmails.sort((a, b) => {
        switch (filters.sort) {
          case "newest":
            return new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime();
          case "oldest":
            return new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime();
          case "sender-asc":
            return a.from.localeCompare(b.from);
          case "sender-desc":
            return b.from.localeCompare(a.from);
          default:
            return 0;
        }
      });
    }
  }

  const listRef = useRef<HTMLDivElement>(null);
  const pageEmailIds = displayEmails.map((email) => email.id) ?? [];
  const selectedSet = useMemo(() => new Set(selectedEmailIds), [selectedEmailIds]);
  const allSelectedOnPage =
    pageEmailIds.length > 0 && pageEmailIds.every((id) => selectedSet.has(id));
  const someSelectedOnPage = !allSelectedOnPage && pageEmailIds.some((id) => selectedSet.has(id));

  const virtualizer = useVirtualizer({
    count: displayEmails.length || 0,
    getScrollElement: () => listRef.current,
    estimateSize: () => 88,
    overscan: 5,
  });

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [page, folder]);

  const handleKeyDown = (e: React.KeyboardEvent, emailId: string, index: number) => {
    if (!data?.emails) return;

    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        onSelectEmail(emailId);
        break;
      case "ArrowDown":
        e.preventDefault();
        if (index < data.emails.length - 1) {
          const nextButton = document.querySelector(
            `[data-email-index="${index + 1}"]`
          ) as HTMLButtonElement;
          nextButton?.focus();
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (index > 0) {
          const prevButton = document.querySelector(
            `[data-email-index="${index - 1}"]`
          ) as HTMLButtonElement;
          prevButton?.focus();
        }
        break;
    }
  };

  const totalPages = data?.totalPages || 0;
  const hasMore = data?.hasMore ?? false;
  const currentTotal = data?.total || 0;
  const totalMatching = allMatchingCount ?? currentTotal;
  const startItem = currentTotal > 0 ? (page - 1) * pageSize + 1 : 0;
  const endItem = Math.min(page * pageSize, currentTotal);
  const showPagination = !isLoading && data && data.emails.length > 0 && onPageChange;
  const showSelectAllPrompt = Boolean(
    onSelectAllMatching &&
      allSelectedOnPage &&
      !isAllMatchingSelected &&
      (hasMore || selectedEmailIds.length < totalMatching)
  );
  const showAllSelectedBanner = Boolean(isAllMatchingSelected && selectedEmailIds.length > 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {onToggleEmailSelection && pageEmailIds.length > 0 && (
        <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-2 text-xs text-muted-foreground md:px-4">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={allSelectedOnPage ? true : someSelectedOnPage ? "indeterminate" : false}
              onCheckedChange={(checked) => {
                if (!onSelectPageEmails) return;
                const select = checked === true || checked === "indeterminate";
                onSelectPageEmails(pageEmailIds, select);
              }}
              aria-label="Select all emails on this page"
            />
            <span>Select page</span>
          </div>
          <span>{selectedEmailIds.length} selected</span>
        </div>
      )}

      {showSelectAllPrompt && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-amber-50 px-3 py-2 text-xs text-amber-900 md:px-4">
          <span>All conversations on this page are selected.</span>
          <Button
            variant="link"
            size="sm"
            className="h-auto px-0 text-amber-900"
            onClick={onSelectAllMatching}
            disabled={isSelectAllLoading}
          >
            {isSelectAllLoading && <Loader2 className="mr-1 size-3.5 animate-spin" />}
            Select all conversations in this view
          </Button>
        </div>
      )}

      {showAllSelectedBanner && (
        <div className="border-b bg-emerald-50 px-3 py-2 text-xs text-emerald-900 md:px-4">
          All {allMatchingCount ?? selectedEmailIds.length} conversations that match this view are
          selected.
        </div>
      )}

      {}
      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto" role="list">
        {isLoading || !data || data.emails.length === 0 ? (
          <div className="flex h-full items-center justify-center py-8">
            {isLoading ? (
              <LoadingState message="Loading emails..." />
            ) : (
              <EmptyState
                title="No emails found"
                description="This folder is empty or no emails match your filters"
              />
            )}
          </div>
        ) : (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const email = displayEmails[virtualItem.index];
              const isSelected = selectedEmailId === email.id;
              const isChecked = selectedSet.has(email.id);

              return (
                <button
                  key={email.id}
                  data-email-index={virtualItem.index}
                  onClick={() => onSelectEmail(email.id)}
                  onKeyDown={(e) => handleKeyDown(e, email.id, virtualItem.index)}
                  className={cn(
                    "absolute left-0 top-0 w-full border-b p-4 text-left transition-colors hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary",
                    isSelected && "bg-muted",
                    isChecked && "bg-primary/5",
                    !email.isRead && "font-semibold"
                  )}
                  style={{
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                  role="listitem"
                  aria-label={`Email from ${email.from}: ${email.subject}`}
                  aria-selected={isSelected}
                >
                  <div className="flex items-start justify-between gap-2">
                    {onToggleEmailSelection && (
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => onToggleEmailSelection(email.id)}
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => {
                          event.stopPropagation();
                        }}
                        className="mt-1"
                        aria-label={`Select email from ${email.from}`}
                      />
                    )}
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className={cn("truncate", !email.isRead && "font-bold")}>
                          {email.from}
                        </span>
                        {email.isStarred && (
                          <Star
                            className="size-3 fill-yellow-400 text-yellow-400"
                            aria-label="Starred"
                          />
                        )}
                      </div>
                      <p className={cn("truncate text-sm", !email.isRead && "font-semibold")}>
                        {email.subject}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{email.preview}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="whitespace-nowrap text-xs text-muted-foreground">
                        {format(new Date(email.sentAt), "MMM d")}
                      </span>
                      {!email.isRead && (
                        <div className="size-2 rounded-full bg-blue-500" aria-label="Unread" />
                      )}
                      {email.attachments && email.attachments.length > 0 && (
                        <Paperclip
                          className="size-3 text-muted-foreground"
                          aria-label="Has attachments"
                        />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {}
      {showPagination && (
        <div className="shrink-0 border-t bg-background p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            {}
            <div className="text-xs text-muted-foreground">
              Showing {startItem}-{endItem} of {currentTotal} emails
            </div>

            <div className="flex items-center gap-2">
              {}
              {onPageSizeChange && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Per page:</span>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => onPageSizeChange(Number(value))}
                  >
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  onClick={() => onPageChange(1)}
                  disabled={page === 1}
                >
                  <ChevronsLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  onClick={() => onPageChange(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <div className="flex h-8 min-w-[80px] items-center justify-center text-xs">
                  Page {page} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  onClick={() => onPageChange(page + 1)}
                  disabled={!hasMore}
                  title={hasMore ? "Next page" : "No more pages"}
                >
                  <ChevronRight className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  onClick={() => onPageChange(totalPages)}
                  disabled={!hasMore}
                  title={hasMore ? "Last page" : "No more pages"}
                >
                  <ChevronsRight className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
