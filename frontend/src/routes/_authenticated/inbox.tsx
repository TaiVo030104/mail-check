import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Database,
  Info,
  LogOut,
  Mail,
  Menu,
  PenSquare,
  RefreshCw,
  Settings,
  Shield,
  User,
} from "lucide-react";
import { useState } from "react";

import { AboutDialog } from "@/components/about-dialog";
import { ErrorBoundary } from "@/components/error-boundary";
import { OfflineStatusBanner } from "@/components/offline-status-banner";
import { ComposeDialog } from "@/components/pages/emails/compose-dialog";
import { EmailAccountSettings } from "@/components/pages/emails/email-account-settings";
import { EmailBulkActions } from "@/components/pages/emails/email-bulk-actions";
import { EmailDetail } from "@/components/pages/emails/email-detail";
import { EmailFilters } from "@/components/pages/emails/email-filters";
import { EmailKanban } from "@/components/pages/emails/email-kanban";
import { EmailList } from "@/components/pages/emails/email-list";
import { KeyboardShortcutsHelp } from "@/components/pages/emails/keyboard-shortcuts-help";
import { MailboxSidebar } from "@/components/pages/emails/mailbox-sidebar";
import { UnifiedSearchBar } from "@/components/pages/emails/unified-search-bar";
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
import { UserRole } from "@/constants";
import type { ViewMode } from "@/constants/email";
import { useDeleteEmail, useToggleStar } from "@/hooks/react-query/use-emails";
import { useInbox, useInboxKeyboardShortcuts } from "@/hooks/use-inbox";
import { useToast } from "@/hooks/use-toast";

export const Route = createFileRoute("/_authenticated/inbox")({
  component: InboxPage,
});

function InboxPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isKeyboardHelpOpen, setIsKeyboardHelpOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileDetailView, setIsMobileDetailView] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const inbox = useInbox();
  const toggleStarMutation = useToggleStar();
  const deleteEmailMutation = useDeleteEmail();

  useInboxKeyboardShortcuts({
    selectedEmailId: inbox.selectedEmailId,
    isComposeOpen,
    onCompose: () => setIsComposeOpen(true),
    onRefresh: inbox.handleRefresh,
    onKeyboardHelp: () => setIsKeyboardHelpOpen(true),
    onToggleStar: (id) => toggleStarMutation.mutate(id),
    onDeleteEmail: (id, onSuccess) => deleteEmailMutation.mutate(id, { onSuccess }),
    onCloseDetail: () => {
      inbox.handleCloseDetail();
      setIsMobileDetailView(false);
    },
    toast,
  });

  const handleSelectEmail = (emailId: string) => {
    inbox.handleSelectEmail(emailId);
    setIsMobileDetailView(true);
  };

  const handleCloseDetail = () => {
    inbox.handleCloseDetail();
    setIsMobileDetailView(false);
  };

  const handleSelectFolder = (folder: string) => {
    inbox.handleSelectFolder(folder);
    setIsMobileDetailView(false);
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <OfflineStatusBanner />

      <header
        className="flex h-14 items-center justify-between border-b bg-background px-3 md:h-16 md:px-4"
        role="banner"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="size-9 md:hidden"
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            aria-label="Toggle sidebar menu"
            aria-expanded={isMobileSidebarOpen}
          >
            <Menu className="size-5" />
          </Button>

          <Mail className="size-5 text-primary md:size-6" aria-hidden="true" />
          <h1 className="text-lg font-bold md:text-xl">Email Dashboard</h1>

          <ToggleGroup
            type="single"
            value={inbox.viewMode}
            onValueChange={(v) => v && inbox.setViewMode(v as ViewMode)}
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
              onResultsChange={inbox.handleSearchResultsChange}
              onEmailSelect={inbox.handleSearchEmailSelect}
              folder={inbox.selectedFolder}
              className="flex-1"
            />
            <EmailFilters
              filters={inbox.filters}
              onFiltersChange={inbox.handleFiltersChange}
              onClearFilters={inbox.handleClearFilters}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <Button
            onClick={() => setIsComposeOpen(true)}
            size="icon"
            className="size-9 rounded-full md:hidden"
            aria-label="Compose email"
          >
            <PenSquare className="size-4" />
          </Button>

          <Button onClick={() => setIsComposeOpen(true)} size="sm" className="hidden md:flex">
            <PenSquare className="mr-2 size-4" />
            Compose
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative size-10 rounded-full"
                aria-label={`User menu for ${inbox.userProfile?.username || "user"}`}
              >
                {inbox.userProfile?.picture ? (
                  <img
                    src={inbox.userProfile.picture}
                    alt={inbox.userProfile.username}
                    className="size-full rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center rounded-full bg-primary/10">
                    <User className="size-5 text-primary" />
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{inbox.userProfile?.username || "User"}</p>
                  <p className="text-xs text-muted-foreground">{inbox.userProfile?.email || ""}</p>
                  {inbox.userRole && (
                    <p className="text-xs text-muted-foreground">
                      Role: <span className="font-semibold capitalize">{inbox.userRole}</span>
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => navigate({ to: "/profile" })}
                className="cursor-pointer"
              >
                <User className="mr-2 size-4" />
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsSettingsOpen(true)} className="cursor-pointer">
                <Settings className="mr-2 size-4" />
                Email Accounts
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setIsKeyboardHelpOpen(true)}
                className="cursor-pointer"
              >
                <span className="mr-2 flex size-4 items-center justify-center text-xs font-bold">
                  ?
                </span>
                Keyboard Shortcuts
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsAboutOpen(true)} className="cursor-pointer">
                <Info className="mr-2 size-4" />
                About
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => inbox.seedEmailsMutation.mutate()}
                disabled={inbox.seedEmailsMutation.isPending}
                className="cursor-pointer"
              >
                <Database className="mr-2 size-4" />
                {inbox.seedEmailsMutation.isPending ? "Seeding..." : "Seed Mock Emails"}
              </DropdownMenuItem>
              {inbox.userRole === UserRole.ADMIN && (
                <DropdownMenuItem
                  onClick={() => navigate({ to: "/admin" })}
                  className="cursor-pointer"
                >
                  <Shield className="mr-2 size-4" />
                  Admin Panel
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => inbox.signOutMutation.mutate()}
                disabled={inbox.signOutMutation.isPending}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 size-4" />
                {inbox.signOutMutation.isPending ? "Logging out..." : "Logout"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden" role="main">
        {inbox.viewMode === "kanban" ? (
          <div className="flex w-full min-w-0 flex-1 overflow-hidden p-2 md:p-4">
            <EmailKanban
              filters={inbox.filters}
              searchEmails={inbox.isSearching ? inbox.searchResultEmails : undefined}
              onBackToEmail={() => inbox.setViewMode("email")}
            />
          </div>
        ) : (
          <>
            {isMobileSidebarOpen && (
              <div
                className="fixed inset-0 z-40 bg-black/50 md:hidden"
                onClick={() => setIsMobileSidebarOpen(false)}
                aria-hidden="true"
              />
            )}

            <nav
              className={`w-[280px] shrink-0 border-r bg-background transition-transform duration-200 md:w-64 lg:w-72 ${
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
                  <PenSquare className="size-4" />
                  Compose
                </Button>
              </div>
              <MailboxSidebar
                selectedFolder={inbox.selectedFolder}
                onSelectFolder={handleSelectFolder}
              />
            </nav>

            <ErrorBoundary onReset={() => inbox.handleSelectFolder(inbox.selectedFolder)}>
              <section
                className={`flex size-full shrink-0 flex-col border-r bg-background md:w-2/5 ${
                  isMobileDetailView ? "hidden" : "flex"
                } md:flex`}
                aria-label="Email list"
              >
                <div className="flex shrink-0 items-center justify-between border-b bg-muted/30 px-3 py-2.5 md:px-4 md:py-3">
                  <h2 className="text-lg font-semibold capitalize">{inbox.selectedFolder}</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={inbox.handleRefresh}
                    className="size-8"
                    aria-label="Refresh mailbox"
                  >
                    <RefreshCw className="size-4" />
                  </Button>
                </div>

                <div className="flex min-h-0 flex-1 flex-col">
                  <EmailBulkActions
                    selectedCount={inbox.selectedEmailIds.length}
                    onClearSelection={inbox.resetSelection}
                    onDeleteSelected={inbox.handleBulkDelete}
                    onMarkRead={() => inbox.handleBulkMarkRead(true)}
                    onMarkUnread={() => inbox.handleBulkMarkRead(false)}
                    onStarSelected={() => inbox.handleBulkStar(true)}
                    onUnstarSelected={() => inbox.handleBulkStar(false)}
                    isDeleting={inbox.bulkDeleteMutation.isPending}
                    isMarking={inbox.bulkMarkAsReadMutation.isPending}
                    isStarring={inbox.bulkToggleStarMutation.isPending}
                  />
                  <EmailList
                    folder={inbox.selectedFolder}
                    selectedEmailId={inbox.selectedEmailId}
                    onSelectEmail={handleSelectEmail}
                    page={inbox.currentPage}
                    pageSize={inbox.pageSize}
                    filters={inbox.filters}
                    searchEmails={inbox.isSearching ? inbox.searchResultEmails : undefined}
                    onPageChange={inbox.handlePageChange}
                    onPageSizeChange={inbox.handlePageSizeChange}
                    selectedEmailIds={inbox.selectedEmailIds}
                    onToggleEmailSelection={inbox.handleToggleEmailSelection}
                    onSelectPageEmails={inbox.handleSelectPageEmails}
                    onSelectAllMatching={inbox.handleSelectAllMatching}
                    isAllMatchingSelected={inbox.isAllMatchingSelected}
                    isSelectAllLoading={inbox.selectAllIdsMutation.isPending}
                    allMatchingCount={inbox.allMatchingCount}
                  />
                </div>
              </section>
            </ErrorBoundary>

            <ErrorBoundary onReset={() => inbox.handleCloseDetail()}>
              <article
                className={`flex h-full flex-1 flex-col overflow-hidden bg-background ${
                  isMobileDetailView ? "w-full" : "hidden"
                } md:flex md:w-auto`}
                aria-label="Email detail"
              >
                {inbox.selectedEmailId ? (
                  <EmailDetail
                    emailId={inbox.selectedEmailId}
                    onClose={handleCloseDetail}
                    onDelete={inbox.handleDetailDelete}
                    onBack={handleCloseDetail}
                  />
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center px-6 text-center text-muted-foreground">
                    <Mail className="mx-auto mb-4 size-16 text-muted-foreground/30" />
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
