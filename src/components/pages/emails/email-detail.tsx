import { format, formatDistanceToNow } from "date-fns";
import DOMPurify from "isomorphic-dompurify";
import {
  ArrowLeft,
  Clock,
  Clock3,
  Download,
  ExternalLink,
  FileIcon,
  Forward,
  Loader2,
  Mail,
  Paperclip,
  Reply,
  ReplyAll,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";

import { AttachmentPreview } from "@/components/AttachmentPreview";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  useDeleteEmail,
  useDownloadAttachment,
  useEmailDetail,
  useMarkAsRead,
  useToggleStar,
  useUnsnoozeEmail,
} from "@/hooks/react-query/useEmails";

import { AiSummaryDialog } from "./ai-summary-dialog";
import { ComposeDialog, ComposeMode } from "./compose-dialog";
import { SnoozeDialog } from "./snooze-dialog";

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

interface EmailDetailProps {
  emailId: string;
  onClose: () => void;
  onDelete: () => void;
  onBack?: () => void;
}

// Sanitize HTML content - remove tracking pixels and malicious scripts
function sanitizeEmailHtml(html: string): string {
  if (!html) return "";

  // Remove tracking pixels and web beacons (1x1 images)
  let cleaned = html.replace(
    /<img[^>]*(?:src="[^"]*(?:gs-getmailtracker|mailtracker|pixel|beacon)[^"]*"[^>]*|[^>]*(?:width=["']?[01]["']?|height=["']?[01]["']?)[^>]*)>/gi,
    ""
  );

  // Remove potentially dangerous script-bearing elements
  cleaned = cleaned.replace(/<script[^>]*>.*?<\/script>/gis, "");
  cleaned = cleaned.replace(/<iframe[^>]*>.*?<\/iframe>/gis, "");
  cleaned = cleaned.replace(/<object[^>]*>.*?<\/object>/gis, "");
  cleaned = cleaned.replace(/<embed[^>]*>/gi, "");

  // Sanitize with DOMPurify to prevent XSS
  const sanitized = DOMPurify.sanitize(cleaned, {
    ALLOWED_TAGS: [
      "b",
      "i",
      "em",
      "strong",
      "u",
      "s",
      "strike",
      "a",
      "p",
      "br",
      "div",
      "span",
      "ul",
      "ol",
      "li",
      "img",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "blockquote",
      "code",
      "pre",
      "hr",
      "table",
      "thead",
      "tbody",
      "tfoot",
      "tr",
      "td",
      "th",
      "caption",
      "font",
      "center",
      "sup",
      "sub",
    ],
    ALLOWED_ATTR: [
      "href",
      "target",
      "rel",
      "src",
      "alt",
      "title",
      "width",
      "height",
      "style",
      "class",
      "color",
      "face",
      "size",
      "align",
      "valign",
      "border",
      "cellpadding",
      "cellspacing",
    ],
    ALLOW_DATA_ATTR: false,
    // Allow all safe URIs including http/https/data for images
    ADD_ATTR: ["target"],
  });

  return sanitized;
}

export function EmailDetail({ emailId, onClose, onDelete, onBack }: EmailDetailProps) {
  const { data: email, isLoading } = useEmailDetail(emailId);
  const toggleStarMutation = useToggleStar();
  const markAsReadMutation = useMarkAsRead();
  const deleteEmailMutation = useDeleteEmail();
  const downloadAttachmentMutation = useDownloadAttachment();
  const unsnoozeEmailMutation = useUnsnoozeEmail();
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeMode, setComposeMode] = useState<ComposeMode>("compose");
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [aiSummaryOpen, setAiSummaryOpen] = useState(false);

  const handleToggleStar = () => {
    if (email) {
      toggleStarMutation.mutate(email.id);
    }
  };

  const handleMarkAsUnread = () => {
    if (email) {
      markAsReadMutation.mutate({ id: email.id, isRead: false });
    }
  };

  const handleDelete = () => {
    if (email) {
      deleteEmailMutation.mutate(email.id, {
        onSuccess: () => {
          onDelete();
        },
      });
    }
  };

  const handleDownloadAttachment = (attachmentId: string, filename: string) => {
    downloadAttachmentMutation.mutate({
      attachmentId,
      filename,
      emailId: email?.id, // Pass emailId for Gmail attachments
    });
  };

  const handleReply = () => {
    setComposeMode("reply");
    setComposeOpen(true);
  };

  const handleReplyAll = () => {
    setComposeMode("replyAll");
    setComposeOpen(true);
  };

  const handleForward = () => {
    setComposeMode("forward");
    setComposeOpen(true);
  };

  const handleOpenInGmail = () => {
    if (email?.gmailMessageId) {
      // Open Gmail message in a new tab using the Gmail message ID
      const gmailUrl = `https://mail.google.com/mail/u/0/#all/${email.gmailMessageId}`;
      window.open(gmailUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleUnsnooze = () => {
    if (email) {
      unsnoozeEmailMutation.mutate(email.id, {
        onSuccess: () => {
          // Email will be moved back to inbox automatically
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!email) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p>Email not found</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header - Gmail Style */}
      <div className="border-b bg-white p-4 md:p-6">
        {/* Mobile back button at the top */}
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="-ml-2 mb-3 md:hidden"
            aria-label="Back to email list"
          >
            <ArrowLeft className="mr-2 size-4" />
            Back
          </Button>
        )}

        <div className="mb-3 flex items-start justify-between gap-4 md:mb-4">
          <div className="min-w-0 flex-1">
            <h2 className="mb-3 break-words text-xl font-semibold text-gray-900 md:mb-4 md:text-2xl">
              {email.subject}
            </h2>

            {/* Snooze Status Banner */}
            {(email.isSnoozed || email.labels?.includes('snoozed')) && email.snoozeUntil && (
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-900 dark:bg-orange-950/20 md:mb-4">
                <Clock3 className="size-4 shrink-0 text-orange-600 dark:text-orange-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                    Snoozed email
                  </p>
                  <p className="text-xs text-orange-700 dark:text-orange-300">
                    Will return{" "}
                    {formatDistanceToNow(new Date(email.snoozeUntil), { addSuffix: true })} •{" "}
                    {format(new Date(email.snoozeUntil), "PPp")}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUnsnooze}
                  disabled={unsnoozeEmailMutation.isPending}
                  className="h-8 shrink-0 border-orange-300 text-xs hover:bg-orange-100 dark:border-orange-800 dark:hover:bg-orange-900/50"
                >
                  {unsnoozeEmailMutation.isPending ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    "Unsnooze"
                  )}
                </Button>
              </div>
            )}

            {/* Sender info - Gmail style */}
            <div className="mb-3 flex flex-col items-start gap-2 sm:flex-row md:mb-4 md:items-center md:gap-3">
              <div className="flex w-full items-center gap-2 sm:w-auto md:gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-300 text-xs font-medium text-white md:size-10 md:text-sm">
                  {email.from.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-gray-900 md:text-base">
                    {email.from}
                  </div>
                  <div className="truncate text-xs text-gray-500">to {email.to.split(",")[0]}</div>
                </div>
              </div>
              <div className="text-xs text-gray-500 sm:ml-auto">
                {format(new Date(email.sentAt), "PPp")}
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hidden size-8 shrink-0 md:flex"
            aria-label="Close"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-1.5 border-t pt-3 md:gap-2 md:pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReply}
            className="h-8 gap-1.5 text-xs md:h-9 md:text-sm"
          >
            <Reply className="size-3.5 md:size-4" />
            <span className="hidden sm:inline">Reply</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReplyAll}
            className="h-8 gap-1.5 text-xs md:h-9 md:text-sm"
          >
            <ReplyAll className="size-3.5 md:size-4" />
            <span className="hidden sm:inline">Reply All</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleForward}
            className="h-8 gap-1.5 text-xs md:h-9 md:text-sm"
          >
            <Forward className="size-3.5 md:size-4" />
            <span className="hidden sm:inline">Forward</span>
          </Button>
          {!(email.isSnoozed || email.labels?.includes('snoozed')) ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSnoozeOpen(true)}
              className="h-8 gap-1.5 text-xs md:h-9 md:text-sm"
              aria-label="Snooze"
            >
              <Clock className="size-3.5 md:size-4" />
              <span className="hidden lg:inline">Snooze</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnsnooze}
              disabled={unsnoozeEmailMutation.isPending}
              className="h-8 gap-1.5 border-orange-300 text-xs hover:bg-orange-50 dark:border-orange-800 md:h-9 md:text-sm"
              aria-label="Unsnooze"
            >
              {unsnoozeEmailMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin md:size-4" />
              ) : (
                <>
                  <Clock3 className="size-3.5 text-orange-600 md:size-4" />
                  <span className="hidden lg:inline">Unsnooze</span>
                </>
              )}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAiSummaryOpen(true)}
            className="h-8 gap-1.5 text-xs md:h-9 md:text-sm"
            aria-label="AI Summary"
          >
            <Sparkles className="size-3.5 text-purple-500 md:size-4" />
            <span className="hidden lg:inline">AI Summary</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleStar}
            disabled={toggleStarMutation.isPending}
            className="h-8 gap-1.5 text-xs md:h-9 md:text-sm"
            aria-label={email.isStarred ? "Unstar" : "Star"}
          >
            <Star
              className={`size-3.5 md:size-4 ${email.isStarred ? "fill-yellow-400 text-yellow-400" : ""}`}
            />
            <span className="hidden lg:inline">{email.isStarred ? "Unstar" : "Star"}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAsUnread}
            disabled={markAsReadMutation.isPending}
            className="h-8 gap-1.5 text-xs md:h-9 md:text-sm"
            aria-label="Mark as unread"
          >
            <Mail className="size-3.5 md:size-4" />
            <span className="hidden lg:inline">Unread</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={deleteEmailMutation.isPending}
            className="h-8 gap-1.5 text-xs md:h-9 md:text-sm"
            aria-label="Delete"
          >
            <Trash2 className="size-3.5 md:size-4" />
            <span className="hidden lg:inline">Delete</span>
          </Button>
          {email.gmailMessageId && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenInGmail}
              className="h-8 gap-1.5 text-xs md:h-9 md:text-sm"
              aria-label="Open in Gmail"
            >
              <ExternalLink className="size-3.5 md:size-4" />
              <span className="hidden lg:inline">Open in Gmail</span>
            </Button>
          )}
        </div>
      </div>

      {/* Email Body */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* Attachments */}
        {email.attachments && email.attachments.length > 0 && (
          <div className="mb-4 md:mb-6">
            <div className="mb-2 flex items-center gap-2 md:mb-3">
              <Paperclip className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">Attachments ({email.attachments.length})</span>
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-3 lg:grid-cols-3">
              {email.attachments.map((attachment) => (
                <div
                  key={attachment.id || attachment.attachmentId}
                  className="flex items-center justify-between gap-2 rounded-lg border bg-muted/50 p-3 transition-colors hover:bg-muted"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <FileIcon className="size-8 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p
                        className="truncate text-sm font-medium"
                        title={attachment.filename || attachment.originalName}
                      >
                        {attachment.filename || attachment.originalName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(attachment.size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <AttachmentPreview
                      attachmentId={attachment.id || attachment.attachmentId}
                      filename={attachment.filename || attachment.originalName}
                      mimeType={attachment.mimeType}
                      size={attachment.size}
                      emailId={email.id}
                      onDownload={() =>
                        handleDownloadAttachment(
                          attachment.id || attachment.attachmentId,
                          attachment.filename || attachment.originalName
                        )
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() =>
                        handleDownloadAttachment(
                          attachment.id || attachment.attachmentId,
                          attachment.filename || attachment.originalName
                        )
                      }
                      disabled={downloadAttachmentMutation.isPending}
                      title="Download"
                    >
                      {downloadAttachmentMutation.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Download className="size-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Separator className="mt-6" />
          </div>
        )}

        {/* Email Body Content */}
        <div className="email-content-wrapper">
          <style>{`
      .email-content-wrapper {
        width: 100%;
        overflow-x: auto;
      }
      
      .email-body-content {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        font-size: 14px;
        line-height: 1.6;
        color: #202124;
        word-wrap: break-word;
        overflow-wrap: break-word;
      }
      
      /* Let HTML render naturally - minimal constraints */
      .email-body-content * {
        max-width: 100%;
        box-sizing: border-box;
      }
      
      /* Remove default borders from divs */
      .email-body-content div {
        border: none !important;
      }
      
      /* Typography - preserve email styles */
      .email-body-content h1, .email-body-content h2, .email-body-content h3,
      .email-body-content h4, .email-body-content h5, .email-body-content h6 {
        margin-top: 0.5em;
        margin-bottom: 0.5em;
        font-weight: 600;
      }
      
      .email-body-content p {
        margin: 0.5em 0;
      }
      
      .email-body-content a {
        color: #1a73e8;
        text-decoration: none;
      }
      
      .email-body-content a:hover {
        text-decoration: underline;
      }
      
      /* Images - Responsive and allow external sources */
      .email-body-content img {
        max-width: 100%;
        height: auto;
        display: inline-block;
        vertical-align: middle;
        loading: lazy;
      }
      
      /* Allow images to load from any source */
      .email-body-content img[src] {
        content-visibility: auto;
      }
      
      /* Lists */
      .email-body-content ul, .email-body-content ol {
        margin: 0.5em 0;
        padding-left: 2em;
      }
      
      /* Blockquotes - subtle styling */
      .email-body-content blockquote {
        margin: 1em 0;
        padding-left: 1em;
        border-left: 3px solid #dadce0;
        color: #5f6368;
      }
      
      /* Code blocks */
      .email-body-content pre {
        background-color: #f8f9fa;
        border-radius: 4px;
        padding: 1em;
        overflow-x: auto;
        font-family: 'Courier New', Courier, monospace;
        font-size: 13px;
      }
      
      .email-body-content code {
        background-color: #f8f9fa;
        padding: 0.2em 0.4em;
        border-radius: 3px;
        font-family: 'Courier New', Courier, monospace;
        font-size: 13px;
      }
      
      .email-body-content pre code {
        background-color: transparent;
        padding: 0;
      }
      
      /* Tables - preserve email table styling */
      .email-body-content table {
        border-collapse: collapse;
        margin: 1em 0;
      }
      
      .email-body-content table th,
      .email-body-content table td {
        padding: 8px 12px;
      }
      
      /* Gmail quoted text */
      .email-body-content .gmail_quote {
        margin: 1em 0;
        padding-left: 1em;
        border-left: 2px solid #dadce0;
        color: #5f6368;
      }
      
      /* Plain text emails */
      .email-body-plaintext {
        white-space: pre-wrap;
        font-family: monospace;
        font-size: 13px;
      }
    `}</style>

          {email.body ? (
            email.body.includes("<") && email.body.includes(">") ? (
              <div
                className="email-body-content"
                dangerouslySetInnerHTML={{
                  __html: sanitizeEmailHtml(email.body),
                }}
              />
            ) : (
              <div className="email-body-plaintext">{email.body}</div>
            )
          ) : (
            <p className="italic text-muted-foreground">No content</p>
          )}
        </div>
      </div>

      <ComposeDialog
        open={composeOpen}
        onOpenChange={setComposeOpen}
        mode={composeMode}
        initialData={email ? { email } : undefined}
      />

      <SnoozeDialog
        emailId={email.id}
        open={snoozeOpen}
        onOpenChange={setSnoozeOpen}
        onSuccess={onClose}
      />

      <AiSummaryDialog emailId={email.id} open={aiSummaryOpen} onOpenChange={setAiSummaryOpen} />
    </div>
  );
}
