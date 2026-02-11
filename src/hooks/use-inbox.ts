import { useEffect, useMemo, useState } from "react";

import { DEFAULT_PAGE_SIZE } from "@/constants";
import type { ViewMode } from "@/constants/email";
import { useSignOut, useUserProfile } from "@/hooks/react-query/use-auth";
import {
  useBulkDelete,
  useBulkMarkAsRead,
  useBulkToggleStar,
  useEmailsByFolder,
  useMailboxes,
  useMarkAsRead,
  useSeedMockEmails,
  useSelectAllEmailIds,
} from "@/hooks/react-query/use-emails";
import { useUserRole } from "@/hooks/use-role";
import { useToast } from "@/hooks/use-toast";
import type { EmailFilterValues } from "@/types";
import type { Email } from "@/types";

export function useInbox() {
  const [selectedFolder, setSelectedFolder] = useState("inbox");
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [selectedEmailIds, setSelectedEmailIds] = useState<string[]>([]);
  const [allMatchingCount, setAllMatchingCount] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [filters, setFilters] = useState<EmailFilterValues>({ sort: "newest" });
  const [viewMode, setViewMode] = useState<ViewMode>("email");
  const [searchResultEmails, setSearchResultEmails] = useState<Email[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { refetch: refetchMailboxes } = useMailboxes();
  const { refetch: refetchEmails } = useEmailsByFolder(
    selectedFolder,
    currentPage,
    pageSize,
    filters
  );
  const { data: userProfile } = useUserProfile();
  const signOutMutation = useSignOut();
  const markAsReadMutation = useMarkAsRead();
  const seedEmailsMutation = useSeedMockEmails();
  const bulkDeleteMutation = useBulkDelete();
  const bulkMarkAsReadMutation = useBulkMarkAsRead();
  const bulkToggleStarMutation = useBulkToggleStar();
  const selectAllIdsMutation = useSelectAllEmailIds();
  const userRole = useUserRole();

  const selectedIdsSet = useMemo(() => new Set(selectedEmailIds), [selectedEmailIds]);

  const isAllMatchingSelected = Boolean(
    allMatchingCount !== null && allMatchingCount > 0 && selectedEmailIds.length >= allMatchingCount
  );

  const resetSelection = () => {
    setSelectedEmailIds([]);
    setAllMatchingCount(null);
  };

  const handleSearchResultsChange = (emails: Email[], searching: boolean) => {
    setSearchResultEmails(emails);
    setIsSearching(searching);
    if (!searching) {
      setCurrentPage(1);
    }
  };

  const handleSearchEmailSelect = (email: Email) => {
    setSelectedEmailId(email.id);
  };

  const handleRefresh = () => {
    refetchMailboxes();
    refetchEmails();
  };

  const handleFiltersChange = (newFilters: EmailFilterValues) => {
    setFilters(newFilters);
    setCurrentPage(1);
    resetSelection();
  };

  const handleClearFilters = () => {
    setFilters({ sort: "newest" });
    setCurrentPage(1);
    resetSelection();
  };

  const handleSelectEmail = (emailId: string) => {
    markAsReadMutation.mutate({ id: emailId, isRead: true });
    setSelectedEmailId(emailId);
  };

  const handleCloseDetail = () => {
    setSelectedEmailId(null);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    resetSelection();
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
    resetSelection();
  };

  const handleToggleEmailSelection = (emailId: string) => {
    setAllMatchingCount(null);
    setSelectedEmailIds((prev) =>
      prev.includes(emailId) ? prev.filter((id) => id !== emailId) : [...prev, emailId]
    );
  };

  const handleSelectPageEmails = (emailIds: string[], select: boolean) => {
    setAllMatchingCount(null);
    setSelectedEmailIds((prev) => {
      const next = new Set(prev);
      emailIds.forEach((id) => {
        if (select) next.add(id);
        else next.delete(id);
      });
      return Array.from(next);
    });
  };

  const handleSelectAllMatching = () => {
    if (selectAllIdsMutation.isPending) return;
    selectAllIdsMutation.mutate(
      { folder: selectedFolder, filters },
      {
        onSuccess: ({ emailIds, total }) => {
          setSelectedEmailIds(emailIds);
          setAllMatchingCount(total);
          if (selectedEmailId && !emailIds.includes(selectedEmailId)) {
            handleCloseDetail();
          }
        },
      }
    );
  };

  const handleBulkDelete = () => {
    if (selectedEmailIds.length === 0 || bulkDeleteMutation.isPending) return;
    bulkDeleteMutation.mutate(selectedEmailIds, {
      onSuccess: () => {
        if (selectedEmailId && selectedIdsSet.has(selectedEmailId)) {
          handleCloseDetail();
        }
        resetSelection();
      },
    });
  };

  const handleBulkMarkRead = (isRead: boolean) => {
    if (selectedEmailIds.length === 0 || bulkMarkAsReadMutation.isPending) return;
    bulkMarkAsReadMutation.mutate(
      { emailIds: selectedEmailIds, isRead },
      { onSuccess: resetSelection }
    );
  };

  const handleBulkStar = (star: boolean) => {
    if (selectedEmailIds.length === 0 || bulkToggleStarMutation.isPending) return;
    bulkToggleStarMutation.mutate(
      { emailIds: selectedEmailIds, star },
      { onSuccess: resetSelection }
    );
  };

  const handleDetailDelete = () => {
    if (selectedEmailId) {
      setSelectedEmailIds((prev) => prev.filter((id) => id !== selectedEmailId));
    }
    setAllMatchingCount(null);
    handleCloseDetail();
  };

  const handleSelectFolder = (folder: string) => {
    setSelectedFolder(folder);
    setSelectedEmailId(null);
    setCurrentPage(1);
    resetSelection();
  };

  return {
    selectedFolder,
    selectedEmailId,
    selectedEmailIds,
    allMatchingCount,
    currentPage,
    pageSize,
    filters,
    viewMode,
    searchResultEmails,
    isSearching,
    userProfile,
    userRole,
    isAllMatchingSelected,

    signOutMutation,
    seedEmailsMutation,
    bulkDeleteMutation,
    bulkMarkAsReadMutation,
    bulkToggleStarMutation,
    selectAllIdsMutation,

    setViewMode,
    handleSearchResultsChange,
    handleSearchEmailSelect,
    handleRefresh,
    handleFiltersChange,
    handleClearFilters,
    handleSelectEmail,
    handleCloseDetail,
    handlePageChange,
    handlePageSizeChange,
    handleToggleEmailSelection,
    handleSelectPageEmails,
    handleSelectAllMatching,
    handleBulkDelete,
    handleBulkMarkRead,
    handleBulkStar,
    handleDetailDelete,
    handleSelectFolder,
    resetSelection,
  };
}

export function useInboxKeyboardShortcuts(params: {
  selectedEmailId: string | null;
  isComposeOpen: boolean;
  onCompose: () => void;
  onRefresh: () => void;
  onKeyboardHelp: () => void;
  onToggleStar: (id: string) => void;
  onDeleteEmail: (id: string, onSuccess: () => void) => void;
  onCloseDetail: () => void;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const {
    selectedEmailId,
    isComposeOpen,
    onCompose,
    onRefresh,
    onKeyboardHelp,
    onToggleStar,
    onDeleteEmail,
    onCloseDetail,
    toast,
  } = params;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (isComposeOpen) return;

      switch (e.key.toLowerCase()) {
        case "c":
          e.preventDefault();
          onCompose();
          break;
        case "?":
          e.preventDefault();
          onKeyboardHelp();
          break;
        case "r":
          if (e.ctrlKey || e.metaKey) return;
          e.preventDefault();
          onRefresh();
          toast({ title: "Refreshing", description: "Updating mailbox..." });
          break;
        case "s":
          if (selectedEmailId && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            onToggleStar(selectedEmailId);
          }
          break;
        case "d":
          if (selectedEmailId && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            onDeleteEmail(selectedEmailId, () => {
              onCloseDetail();
              toast({
                title: "Email deleted",
                description: "Email moved to trash",
              });
            });
          }
          break;
        case "escape":
          if (selectedEmailId) {
            e.preventDefault();
            onCloseDetail();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedEmailId,
    isComposeOpen,
    onCompose,
    onRefresh,
    onKeyboardHelp,
    onToggleStar,
    onDeleteEmail,
    onCloseDetail,
    toast,
  ]);
}
