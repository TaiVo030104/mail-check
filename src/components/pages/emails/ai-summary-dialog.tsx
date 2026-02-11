import { Copy, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { emailService } from "@/services/email";

interface AiSummaryDialogProps {
  emailId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AiSummaryDialog({ emailId, open, onOpenChange }: AiSummaryDialogProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCached, setIsCached] = useState(false);

  useEffect(() => {
    if (open && !summary) {
      handleGenerateSummary();
    }
  }, [open]);

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    try {
      const result = await emailService.summarizeEmail(emailId);
      setSummary(result.summary);
      setIsCached(result.cached);

      if (result.cached) {
        toast.info("Đã tải tóm tắt từ bộ nhớ cache");
      } else {
        toast.success("Tóm tắt đã được tạo bởi AI!");
      }
    } catch (error: unknown) {
      const axiosErr = error as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message || "Không thể tạo tóm tắt. Vui lòng thử lại.");

      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySummary = () => {
    if (summary) {
      navigator.clipboard.writeText(summary);
      toast.success("Đã sao chép tóm tắt!");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-purple-500" />
            Tóm tắt Email bằng AI
          </DialogTitle>
          <DialogDescription>
            {isCached ? "Email này đã được tóm tắt trước đó" : "Được tạo bởi Google Gemini AI"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center space-y-3 py-8">
              <Loader2 className="size-8 animate-spin text-purple-500" />
              <p className="text-sm text-muted-foreground">Đang phân tích email...</p>
            </div>
          ) : summary ? (
            <>
              <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <p className="whitespace-pre-wrap">{summary}</p>
                </div>
              </ScrollArea>

              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={handleCopySummary} className="gap-2">
                  <Copy className="size-4" />
                  Sao chép
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateSummary}
                  disabled={isLoading}
                  className="gap-2"
                >
                  <Sparkles className="size-4" />
                  Tạo lại
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
