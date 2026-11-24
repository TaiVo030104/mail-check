import { Download, Eye, Loader2, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import api from "@/services/api-client";

interface AttachmentPreviewProps {
  attachmentId: string;
  filename: string;
  mimeType: string;
  size: number;
  emailId?: string;
  onDownload: () => void;
}

export function AttachmentPreview({
  attachmentId,
  filename,
  mimeType,
  emailId,
  onDownload,
}: AttachmentPreviewProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const isPreviewable = () => {
    if (!mimeType) return false;

    if (mimeType.startsWith("image/")) return true;

    if (mimeType === "application/pdf") return true;

    if (
      mimeType.startsWith("text/") ||
      mimeType === "application/json" ||
      mimeType === "application/xml"
    ) {
      return true;
    }

    return false;
  };

  const handlePreview = async () => {
    if (!isPreviewable()) return;

    setLoading(true);
    setError("");
    setPreviewOpen(true);

    try {
      const params = emailId ? { emailId } : {};

      const response = await api.get(`emails/attachments/${attachmentId}/download`, {
        params,
        responseType: "blob",
      });

      const blob = new Blob([response.data]);
      const blobUrl = URL.createObjectURL(blob);
      setPreviewUrl(blobUrl);
    } catch (err) {
      setError("Failed to load preview");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPreviewOpen(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    }
    setError("");
  };

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex h-[500px] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex h-[500px] items-center justify-center">
          <p className="text-destructive">{error}</p>
        </div>
      );
    }

    if (!previewUrl) return null;

    if (mimeType?.startsWith("image/")) {
      return (
        <div className="flex max-h-[600px] items-center justify-center overflow-auto rounded-lg bg-muted/20 p-4">
          <img src={previewUrl} alt={filename} className="h-auto max-w-full object-contain" />
        </div>
      );
    }

    if (mimeType === "application/pdf") {
      return (
        <iframe
          src={previewUrl}
          className="h-[600px] w-full rounded-lg border-0"
          title={filename}
        />
      );
    }

    if (
      mimeType?.startsWith("text/") ||
      mimeType === "application/json" ||
      mimeType === "application/xml"
    ) {
      return (
        <div className="max-h-[600px] overflow-auto rounded-lg bg-muted/20 p-4">
          <iframe src={previewUrl} className="h-[550px] w-full border-0" title={filename} />
        </div>
      );
    }

    return null;
  };

  if (!isPreviewable()) {
    return null;
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handlePreview}
        className="size-8 p-0"
        title="Preview"
      >
        <Eye className="size-4" />
      </Button>

      <Dialog open={previewOpen} onOpenChange={handleClose}>
        <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col overflow-hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="truncate pr-4 text-lg font-semibold">{filename}</DialogTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={onDownload} className="gap-2">
                  <Download className="size-4" />
                  Download
                </Button>
                <Button variant="ghost" size="sm" onClick={handleClose} className="size-8 p-0">
                  <X className="size-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-auto">{renderPreview()}</div>
        </DialogContent>
      </Dialog>
    </>
  );
}
