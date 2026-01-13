import { createFileRoute } from "@tanstack/react-router";
import { Database, LogOut, Mail, Menu, PenSquare, RefreshCw, Settings, Shield, User, Info } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

// import { ThemeToggle } from '@/components/theme-toggle';
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AboutDialog } from "@/components/AboutDialog";
import { ComposeDialog } from "@/components/pages/emails/compose-dialog";
import { EmailBulkActions } from "@/components/pages/emails/email-bulk-actions";
import { EmailDetail } from "@/components/pages/emails/email-detail";
import { EmailFilters, EmailFilterValues } from "@/components/pages/emails/email-filters";
import { EmailKanbanRefactored } from "@/components/pages/emails/email-kanban-refactored";
import { EmailList } from "@/components/pages/emails/email-list";
import { KeyboardShortcutsHelp } from "@/components/pages/emails/keyboard-shortcuts-help";
import { MailboxSidebar } from "@/components/pages/emails/mailbox-sidebar";
import { UnifiedSearchBar } from "@/components/pages/emails/unified-search-bar";
import { EmailAccountSettings } from "@/components/pages/emails/EmailAccountSettings";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useSignOut, useUserProfile } from "@/hooks/react-query/useAuth";
import {
  useDeleteEmail,
  useEmailsByFolder,
  useMailboxes,
  useMarkAsRead,
  useSeedMockEmails,
  useToggleStar,
  useBulkDelete,
  useBulkMarkAsRead,
  useBulkToggleStar,
  useSelectAllEmailIds,
} from "@/hooks/react-query/useEmails";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useRole";

export const Route = createFileRoute("/_authenticated/inbox")({
  component: InboxPage,
});

function InboxPage() {
  const [selectedFolder, setSelectedFolder] = useState("inbox");
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [selectedEmailIds, setSelectedEmailIds] = useState<string[]>([]);
  const [allMatchingCount, setAllMatchingCount] = useState<number | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isKeyboardHelpOpen, setIsKeyboardHelpOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileDetailView, setIsMobileDetailView] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [filters, setFilters] = useState<EmailFilterValues>({ sort: "newest" });
  const [viewMode, setViewMode] = useState<"email" | "kanban">("email");
  const [searchResultEmails, setSearchResultEmails] = useState<any[]>([]);
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
  const toggleStarMutation = useToggleStar();
  const deleteEmailMutation = useDeleteEmail();
  const seedEmailsMutation = useSeedMockEmails();
  const bulkDeleteMutation = useBulkDelete();
  const bulkMarkAsReadMutation = useBulkMarkAsRead();
  const bulkToggleStarMutation = useBulkToggleStar();
  const selectAllIdsMutation = useSelectAllEmailIds();
  const userRole = useUserRole();
  const { toast } = useToast();
  const selectedIdsSet = useMemo(() => new Set(selectedEmailIds), [selectedEmailIds]);
  
  // Handler for unified search
  const handleSearchResultsChange = (emails: any[], searching: boolean) => {
    setSearchResultEmails(emails);
    setIsSearching(searching);
    if (!searching) {
      // Reset when search is cleared
      setCurrentPage(1);
    }
  };

  const handleSearchEmailSelect = (email: any) => {
    console.log('handleSearchEmailSelect called with:', email);
    console.log('Email ID to set:', email?.id);
    setSelectedEmailId(email.id);
    setIsMobileDetailView(true);
  };
  
  const isAllMatchingSelected = Boolean(
    allMatchingCount !== null && allMatchingCount > 0 && selectedEmailIds.length >= allMatchingCount,
  );

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Don't trigger shortcuts if a modal is open
      if (isComposeOpen) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case "c":
          // Compose new email
          e.preventDefault();
          setIsComposeOpen(true);
          break;
        case "/":
        case "k":
          // Activate search (Cmd/Ctrl + K or just /)
          if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            // Focus will be handled by SmartSearchBar
          } else if (e.key === "/" && !e.metaKey && !e.ctrlKey) {
            e.preventDefault();
          }
          break;
        case "?":
          // Show keyboard shortcuts help
          e.preventDefault();
          setIsKeyboardHelpOpen(true);
          break;
        case "r":
          // Refresh
          if (e.ctrlKey || e.metaKey) {
            // Allow default browser refresh
            return;
          }
          e.preventDefault();
          handleRefresh();
          toast({
            title: "Refreshing",
            description: "Updating mailbox...",
          });
          break;
        case "s":
          // Star/unstar selected email
          if (selectedEmailId && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            toggleStarMutation.mutate(selectedEmailId);
          }
          break;
        case "delete":
        case "d":
          // Delete selected email (only 'd' key, not 'delete' key to avoid accidental deletion)
          if (selectedEmailId && e.key === "d" && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            deleteEmailMutation.mutate(selectedEmailId, {
              onSuccess: () => {
                handleCloseDetail();
                toast({
                  title: "Email deleted",
                  description: "Email moved to trash",
                });
              },
            });
          }
          break;
        case "escape":
          // Close email detail or compose
          if (selectedEmailId) {
            e.preventDefault();
            handleCloseDetail();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedEmailId, isComposeOpen, toggleStarMutation, deleteEmailMutation, toast]);

  const handleRefresh = () => {
    refetchMailboxes();
    refetchEmails();
  };

  const handleFiltersChange = (newFilters: EmailFilterValues) => {
    setFilters(newFilters);
    setCurrentPage(1);
    setSelectedEmailIds([]);
    setAllMatchingCount(null);
  };

  const handleClearFilters = () => {
    setFilters({ sort: "newest" });
    setCurrentPage(1);
    setSelectedEmailIds([]);
    setAllMatchingCount(null);
  };

  const handleSelectEmail = (emailId: string) => {
    // Mark as read immediately with optimistic update
    markAsReadMutation.mutate({ id: emailId, isRead: true });
    setSelectedEmailId(emailId);
    setIsMobileDetailView(true);
  };

  const handleCloseDetail = () => {
    setSelectedEmailId(null);
    setIsMobileDetailView(false);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedEmailIds([]);
    setAllMatchingCount(null);
  };

  const handleToggleEmailSelection = (emailId: string) => {
    setAllMatchingCount(null);
    setSelectedEmailIds((prev) =>
      prev.includes(emailId) ? prev.filter((id) => id !== emailId) : [...prev, emailId],
    );
  };

  const handleSelectPageEmails = (emailIds: string[], select: boolean) => {
    setAllMatchingCount(null);
    setSelectedEmailIds((prev) => {
      const next = new Set(prev);
      emailIds.forEach((id) => {
        if (select) {
          next.add(id);
        } else {
          next.delete(id);
        }
      });
      return Array.from(next);
    });
  };

  const clearSelection = () => {
    setSelectedEmailIds([]);
    setAllMatchingCount(null);
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
      },
    );
  };

  const handleBulkDelete = () => {
    if (selectedEmailIds.length === 0 || bulkDeleteMutation.isPending) return;
    bulkDeleteMutation.mutate(selectedEmailIds, {
      onSuccess: () => {
        if (selectedEmailId && selectedIdsSet.has(selectedEmailId)) {
          handleCloseDetail();
        }
        clearSelection();
      },
    });
  };

  const handleBulkMarkRead = (isRead: boolean) => {
    if (selectedEmailIds.length === 0 || bulkMarkAsReadMutation.isPending) return;
    bulkMarkAsReadMutation.mutate(
      {
        emailIds: selectedEmailIds,
        isRead,
      },
      {
        onSuccess: () => {
          clearSelection();
        },
      },
    );
  };

  const handleBulkStar = (star: boolean) => {
    if (selectedEmailIds.length === 0 || bulkToggleStarMutation.isPending) return;
    bulkToggleStarMutation.mutate(
      {
        emailIds: selectedEmailIds,
        star,
      },
      {
        onSuccess: () => {
          clearSelection();
        },
      },
    );
  };

  const handleDetailDelete = () => {
    if (selectedEmailId) {
      setSelectedEmailIds((prev) => prev.filter((id) => id !== selectedEmailId));
    }
    setAllMatchingCount(null);
    handleCloseDetail();
  };


  const handleLogout = () => {
    signOutMutation.mutate();
  };

  const handleSeedEmails = () => {
    seedEmailsMutation.mutate();
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      {/* Top Navigation Bar */}
      <header
        className="flex h-14 items-center justify-between border-b bg-background px-3 md:h-16 md:px-4"
        role="banner"
      >
        <div className="flex flex-1 items-center gap-2 md:gap-3 min-w-0">
          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 md:hidden"
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            aria-label="Toggle sidebar menu"
            aria-expanded={isMobileSidebarOpen}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <Mail className="h-5 w-5 text-primary md:h-6 md:w-6" aria-hidden="true" />
          <h1 className="text-lg font-bold md:text-xl">Email Dashboard</h1>

          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(v) => v && setViewMode(v as "email" | "kanban")}
            className="hidden md:flex"
            aria-label="View mode"
          >
            <ToggleGroupItem value="email" aria-label="Email view">
              Email
            </ToggleGroupItem>
            <ToggleGroupItem value="kanban" aria-label="Kanban view">
              Kanban
            </ToggleGroupItem>
          </ToggleGroup>
          <div className="ml-2 mr-4 flex flex-1 items-center gap-2">
            <UnifiedSearchBar
              onResultsChange={handleSearchResultsChange}
              onEmailSelect={handleSearchEmailSelect}
              folder={selectedFolder}
              className="flex-1"
            />
            <EmailFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Mobile Compose FAB */}
          <Button
            onClick={() => setIsComposeOpen(true)}
            size="icon"
            className="h-9 w-9 rounded-full md:hidden"
            aria-label="Compose email"
          >
            <PenSquare className="h-4 w-4" />
          </Button>

          {/* Desktop Compose Button */}
          <Button onClick={() => setIsComposeOpen(true)} size="sm" className="hidden md:flex">
            <PenSquare className="mr-2 h-4 w-4" />
            Compose
          </Button>

          {/* Theme Toggle */}
          {/* <ThemeToggle /> */}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-10 w-10 rounded-full"
                aria-label={`User menu for ${userProfile?.username || "user"}`}
              >
                {userProfile?.picture ? (
                  <img
                    src={userProfile.picture}
                    alt={userProfile.username}
                    className="h-full w-full rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{userProfile?.username || "User"}</p>
                  <p className="text-xs text-muted-foreground">{userProfile?.email || ""}</p>
                  {userRole && (
                    <p className="text-xs text-muted-foreground">
                      Role: <span className="font-semibold capitalize">{userRole}</span>
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => (window.location.href = "/profile")}
                className="cursor-pointer"
              >
                <User className="mr-2 h-4 w-4" />
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setIsSettingsOpen(true)}
                className="cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" />
                Email Accounts
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setIsKeyboardHelpOpen(true)}
                className="cursor-pointer"
              >
                <span className="mr-2 flex h-4 w-4 items-center justify-center text-xs font-bold">
                  ?
                </span>
                Keyboard Shortcuts
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setIsAboutOpen(true)}
                className="cursor-pointer"
              >
                <Info className="mr-2 h-4 w-4" />
                About
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleSeedEmails}
                disabled={seedEmailsMutation.isPending}
                className="cursor-pointer"
              >
                <Database className="mr-2 h-4 w-4" />
                {seedEmailsMutation.isPending ? "Seeding..." : "Seed Mock Emails"}
              </DropdownMenuItem>
              {userRole === "admin" && (
                <DropdownMenuItem
                  onClick={() => (window.location.href = "/admin")}
                  className="cursor-pointer"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Admin Panel
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                disabled={signOutMutation.isPending}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {signOutMutation.isPending ? "Logging out..." : "Logout"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex flex-1 overflow-hidden" role="main">
        {viewMode === "kanban" ? (
          <div className="flex w-full flex-1 overflow-hidden p-4">
            <EmailKanbanRefactored
              filters={filters}
              searchEmails={isSearching ? searchResultEmails : undefined}
              onBackToEmail={() => setViewMode("email")}
            />
          </div>
        ) : (
          <>
            {/* Mobile Sidebar Overlay */}
            {isMobileSidebarOpen && (
              <div
                className="fixed inset-0 z-40 bg-black/50 md:hidden"
                onClick={() => setIsMobileSidebarOpen(false)}
                aria-hidden="true"
              />
            )}

            {/* Column 1: Mailbox Sidebar - 20% width on desktop */}
            <nav
              className={`w-[280px] flex-shrink-0 border-r bg-background transition-transform duration-200 md:w-64 lg:w-72 ${
                isMobileDetailView
                  ? "hidden md:block"
                  : isMobileSidebarOpen
                    ? "fixed bottom-0 left-0 top-14 z-50 shadow-2xl md:relative md:top-0 md:shadow-none"
                    : "hidden md:block"
              }`}
              aria-label="Mailbox folders"
            >
              <div className="border-b bg-background p-3 md:hidden">
                <Button
                  onClick={() => {
                    setIsComposeOpen(true);
                    setIsMobileSidebarOpen(false);
                  }}
                  className="w-full gap-2"
                  size="default"
                >
                  <PenSquare className="h-4 w-4" />
                  Compose
                </Button>
              </div>
              <MailboxSidebar
                selectedFolder={selectedFolder}
                onSelectFolder={(folder) => {
                  setSelectedFolder(folder);
                  setSelectedEmailId(null);
                  setIsMobileDetailView(false);
                  setIsMobileSidebarOpen(false);
                  setCurrentPage(1);
                  setSelectedEmailIds([]);
                  setAllMatchingCount(null);
                }}
              />
            </nav>

            {/* Column 2: Email List - 40% width on desktop */}
            <ErrorBoundary onReset={() => setSelectedFolder(selectedFolder)}>
              <section
                className={`flex h-full w-full flex-shrink-0 flex-col border-r bg-background md:w-[40%] ${
                  isMobileDetailView ? "hidden" : "flex"
                } md:flex`}
                aria-label="Email list"
              >
                <div className="flex flex-shrink-0 items-center justify-between border-b bg-muted/30 px-3 py-2.5 md:px-4 md:py-3">
                  <h2 className="text-lg font-semibold capitalize">{selectedFolder}</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRefresh}
                    className="h-8 w-8"
                    aria-label="Refresh mailbox"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex min-h-0 flex-1 flex-col">
                  <EmailBulkActions
                    selectedCount={selectedEmailIds.length}
                    onClearSelection={clearSelection}
                    onDeleteSelected={handleBulkDelete}
                    onMarkRead={() => handleBulkMarkRead(true)}
                    onMarkUnread={() => handleBulkMarkRead(false)}
                    onStarSelected={() => handleBulkStar(true)}
                    onUnstarSelected={() => handleBulkStar(false)}
                    isDeleting={bulkDeleteMutation.isPending}
                    isMarking={bulkMarkAsReadMutation.isPending}
                    isStarring={bulkToggleStarMutation.isPending}
                  />
                  <EmailList
                    folder={selectedFolder}
                    selectedEmailId={selectedEmailId}
                    onSelectEmail={handleSelectEmail}
                    page={currentPage}
                    pageSize={pageSize}
                    filters={filters}
                    searchEmails={isSearching ? searchResultEmails : undefined}
                    onPageChange={handlePageChange}
                    onPageSizeChange={(size) => {
                      setPageSize(size);
                      setCurrentPage(1);
                      setSelectedEmailIds([]);
                      setAllMatchingCount(null);
                    }}
                    selectedEmailIds={selectedEmailIds}
                    onToggleEmailSelection={handleToggleEmailSelection}
                    onSelectPageEmails={handleSelectPageEmails}
                    onSelectAllMatching={handleSelectAllMatching}
                    isAllMatchingSelected={isAllMatchingSelected}
                    isSelectAllLoading={selectAllIdsMutation.isPending}
                    allMatchingCount={allMatchingCount}
                  />
                </div>
              </section>
            </ErrorBoundary>

            {/* Column 3: Email Detail - 40% width on desktop */}
            <ErrorBoundary onReset={() => setSelectedEmailId(null)}>
              <article
                className={`flex h-full flex-1 flex-col overflow-hidden bg-background ${
                  isMobileDetailView ? "w-full" : "hidden"
                } md:flex md:w-auto`}
                aria-label="Email detail"
              >
                {selectedEmailId ? (
                  <EmailDetail
                    emailId={selectedEmailId}
                    onClose={handleCloseDetail}
                    onDelete={handleDetailDelete}
                    onBack={handleCloseDetail}
                  />
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center px-6 text-center text-muted-foreground">
                    <Mail className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />
                    <p className="text-lg font-medium">No email selected</p>
                    <p className="text-sm">Select an email from the list to view its contents</p>
                  </div>
                )}
              </article>
            </ErrorBoundary>
          </>
        )}
      </main>

      <ComposeDialog open={isComposeOpen} onOpenChange={setIsComposeOpen} />

      <KeyboardShortcutsHelp open={isKeyboardHelpOpen} onOpenChange={setIsKeyboardHelpOpen} />
      
      <AboutDialog open={isAboutOpen} onOpenChange={setIsAboutOpen} />
      
      <EmailAccountSettings open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </div>
  );
}
