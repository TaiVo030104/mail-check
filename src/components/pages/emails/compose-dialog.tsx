import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, ChevronUp, FileIcon, Loader2, Paperclip, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AUTO_SAVE_INTERVAL_MS, MAX_ATTACHMENT_SIZE } from "@/constants";
import { useCreateDraft, useDeleteDraft, useUpdateDraft } from "@/hooks/react-query/use-drafts";
import { useSendEmail, useUploadAttachment } from "@/hooks/react-query/use-emails";
import { useToast } from "@/hooks/use-toast";
import type { AttachmentDto, EmailDetail } from "@/types/email";

function extractEmailAddress(emailString: string): string {
  if (!emailString) return "";

  const match = emailString.match(/<([^>]+)>/);
  if (match) {
    return match[1].trim();
  }

  return emailString.trim();
}

const formSchema = z.object({
  to: z.string().refine(
    (val) => {
      const emails = val.split(",").map((e) => e.trim());
      return emails.every((emailStr) => {
        if (!emailStr) return false;
        const email = extractEmailAddress(emailStr);
        return z.string().email().safeParse(email).success;
      });
    },
    { message: "Invalid email address(es)" }
  ),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Message body is required"),
});

type FormInputs = z.infer<typeof formSchema>;

export type ComposeMode = "compose" | "reply" | "replyAll" | "forward";

interface ComposeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: ComposeMode;
  draftId?: string | null;
  initialData?: {
    email?: EmailDetail;
    to?: string;
    subject?: string;
    body?: string;
  };
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function ComposeDialog({
  open,
  onOpenChange,
  mode = "compose",
  draftId,
  initialData,
}: ComposeDialogProps) {
  const [attachments, setAttachments] = useState<AttachmentDto[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(draftId || null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showQuotedText, setShowQuotedText] = useState(false);
  const [quotedText, setQuotedText] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const form = useForm<FormInputs>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      to: "",
      subject: "",
      body: "",
    },
  });

  const sendEmailMutation = useSendEmail();
  const uploadAttachmentMutation = useUploadAttachment();
  const createDraftMutation = useCreateDraft();
  const updateDraftMutation = useUpdateDraft();
  const deleteDraftMutation = useDeleteDraft();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      for (const file of Array.from(files)) {
        if (file.size > MAX_ATTACHMENT_SIZE) {
          toast({
            title: "Error",
            description: `File "${file.name}" exceeds the 25MB limit`,
            variant: "destructive",
          });
          continue;
        }

        const result = await uploadAttachmentMutation.mutateAsync(file);
        setAttachments((prev) => [...prev, result]);
      }
    } catch (error: unknown) {
      const axiosErr = error as { response?: { data?: { message?: string } } };
      toast({
        title: "Upload Failed",
        description: axiosErr.response?.data?.message || "Failed to upload attachment",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeAttachment = (attachmentId: string) => {
    setAttachments((prev) => prev.filter((a) => a.attachmentId !== attachmentId));
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      form.reset();
      setAttachments([]);
      setCurrentDraftId(null);
      setLastSaved(null);

      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    }
    onOpenChange(open);
  };

  useEffect(() => {
    if (!open) return;

    const saveDraft = async () => {
      const values = form.getValues();

      if (!values.to && !values.subject && !values.body) return;

      try {
        const draftData = {
          to: values.to || "",
          subject: values.subject || "",
          body: values.body || "",
        };

        if (currentDraftId) {
          await updateDraftMutation.mutateAsync({
            draftId: currentDraftId,
            updateDto: draftData,
          });
        } else {
          const draft = await createDraftMutation.mutateAsync(draftData);
          setCurrentDraftId(draft._id);
        }

        setLastSaved(new Date());
      } catch {
        // ignore - auto-save failure is non-critical
      }
    };

    autoSaveTimerRef.current = setInterval(saveDraft, AUTO_SAVE_INTERVAL_MS);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [open, currentDraftId, form, createDraftMutation, updateDraftMutation]);

  useEffect(() => {
    if (open && initialData?.email) {
      const email = initialData.email;

      if (mode === "forward") {
        const quoted = `\n\n---------- Forwarded message ---------\nFrom: ${email.from}\nDate: ${email.sentAt}\nSubject: ${email.subject}\nTo: ${email.to}\n\n${email.body}`;
        setQuotedText(quoted);
        form.reset({
          to: initialData.to || "",
          subject: email.subject.startsWith("Fw:") ? email.subject : `Fw: ${email.subject}`,
          body: initialData.body || "",
        });
      } else if (mode === "reply" || mode === "replyAll") {
        let toValue = extractEmailAddress(email.from);
        if (mode === "replyAll" && email.to) {
          const originalToEmails = email.to.split(",").map((e) => extractEmailAddress(e.trim()));
          const recipientsSet = new Set([extractEmailAddress(email.from)]);
          originalToEmails.forEach((e) => {
            const emailAddr = extractEmailAddress(e);
            if (
              emailAddr &&
              emailAddr.toLowerCase() !== extractEmailAddress(email.from).toLowerCase()
            ) {
              recipientsSet.add(emailAddr);
            }
          });
          toValue = Array.from(recipientsSet).join(", ");
        }

        const quoted = `\n\nOn ${email.sentAt}, ${email.from} wrote:\n\n${email.body}`;
        setQuotedText(quoted);
        form.reset({
          to: toValue,
          subject: email.subject.startsWith("Re:") ? email.subject : `Re: ${email.subject}`,
          body: initialData.body || "",
        });
      } else {
        setQuotedText("");
        form.reset({
          to: initialData.to || "",
          subject: initialData.subject || "",
          body: initialData.body || "",
        });
      }
    } else if (open && initialData) {
      setQuotedText("");
      form.reset({
        to: initialData.to || "",
        subject: initialData.subject || "",
        body: initialData.body || "",
      });
    } else if (open) {
      setQuotedText("");
      form.reset({
        to: "",
        subject: "",
        body: "",
      });
    }
  }, [open, mode, initialData, form]);

  const onSubmit = async (data: FormInputs) => {
    const fullBody = quotedText ? `${data.body}${quotedText}` : data.body;

    if (mode === "reply" || mode === "replyAll") {
      if (initialData?.email) {
        sendEmailMutation.mutate(
          {
            to: data.to,
            subject: data.subject,
            body: fullBody,
            attachments: attachments.length > 0 ? attachments : undefined,
          },
          {
            onSuccess: () => {
              form.reset();
              setAttachments([]);
              setQuotedText("");
              onOpenChange(false);
            },
          }
        );
      }
    } else {
      sendEmailMutation.mutate(
        {
          ...data,
          body: fullBody,
          attachments: attachments.length > 0 ? attachments : undefined,
        },
        {
          onSuccess: () => {
            form.reset();
            setAttachments([]);
            setQuotedText("");

            if (currentDraftId) {
              deleteDraftMutation.mutate(currentDraftId);
            }
            onOpenChange(false);
          },
        }
      );
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "reply":
        return "Reply";
      case "replyAll":
        return "Reply All";
      case "forward":
        return "Forward";
      default:
        return "Compose Email";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto md:max-h-[85vh] md:w-full">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl">{getTitle()}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 md:space-y-4">
            <FormField
              control={form.control}
              name="to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="recipient@example.com"
                      {...field}
                      disabled={mode === "reply" || mode === "replyAll"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="Email subject" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Type your message here..."
                      rows={8}
                      className="min-h-[150px] md:min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {}
            {quotedText && (mode === "reply" || mode === "replyAll" || mode === "forward") && (
              <div className="overflow-hidden rounded-md border">
                <button
                  type="button"
                  onClick={() => setShowQuotedText(!showQuotedText)}
                  className="flex w-full items-center justify-between bg-muted/50 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
                >
                  <span className="flex items-center gap-2">
                    {showQuotedText ? (
                      <ChevronUp className="size-4" />
                    ) : (
                      <ChevronDown className="size-4" />
                    )}
                    {mode === "forward" ? "Forwarded message" : "Original message"}
                  </span>
                  <span className="text-xs">Click to {showQuotedText ? "hide" : "show"}</span>
                </button>
                {showQuotedText && (
                  <div className="border-t bg-muted/30 p-3">
                    <pre className="whitespace-pre-wrap font-sans text-xs text-muted-foreground">
                      {quotedText}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {}
            {attachments.length > 0 && (
              <div className="space-y-2">
                <FormLabel>Attachments</FormLabel>
                <div className="flex flex-col gap-2">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.attachmentId}
                      className="flex items-center justify-between gap-2 rounded-md bg-muted px-3 py-2 text-sm"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <FileIcon className="size-4 shrink-0 text-muted-foreground" />
                        <span className="truncate" title={attachment.filename}>
                          {attachment.filename}
                        </span>
                        <span className="whitespace-nowrap text-xs text-muted-foreground">
                          ({formatFileSize(attachment.size)})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(attachment.attachmentId)}
                        className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                        aria-label="Remove attachment"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept="*/*"
            />

            <div className="flex flex-col items-stretch justify-between gap-3 pt-2 sm:flex-row sm:items-center">
              <div className="flex flex-wrap items-center gap-2">
                {}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Paperclip className="mr-2 size-4" />
                  )}
                  {isUploading ? "Uploading..." : "Attach"}
                </Button>

                {}
                {}

                {}
                {lastSaved && (
                  <span className="text-xs text-muted-foreground">
                    Saved{" "}
                    {new Date().getTime() - lastSaved.getTime() < 60000
                      ? "just now"
                      : `${Math.floor((new Date().getTime() - lastSaved.getTime()) / 60000)}m ago`}
                  </span>
                )}
              </div>

              <div className="flex w-full gap-2 sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleClose(false)}
                  className="flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={sendEmailMutation.isPending || isUploading}
                  className="flex-1 sm:flex-none"
                >
                  {sendEmailMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                  {mode === "reply" || mode === "replyAll"
                    ? "Reply"
                    : mode === "forward"
                      ? "Forward"
                      : "Send"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
