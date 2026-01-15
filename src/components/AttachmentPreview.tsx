import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, Download, X } from "lucide-react";
import { useState } from "react";
import { Loader2 } from "lucide-react";

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
  size,
  emailId,
  onDownload,
}: AttachmentPreviewProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Determine if file can be previewed
  const isPreviewable = () => {
    if (!mimeType) return false;
    
    // Images
    if (mimeType.startsWith("image/")) return true;
    
    // PDF
    if (mimeType === "application/pdf") return true;
    
    // Text files
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
      // Construct download URL
      const params = new URLSearchParams();
      if (emailId) {
        params.append("emailId", emailId);
      }
      
      const url = `/emails/attachments/${attachmentId}/download?${params.toString()}`;
      
      // Fetch the file as blob
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load preview");
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      setPreviewUrl(blobUrl);
    } catch (err) {
      console.error("Preview error:", err);
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
        <div className="flex items-center justify-center h-[500px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-[500px]">
          <p className="text-destructive">{error}</p>
        </div>
      );
    }

    if (!previewUrl) return null;

    // Image preview
    if (mimeType?.startsWith("image/")) {
      return (
        <div className="flex items-center justify-center max-h-[600px] overflow-auto bg-muted/20 rounded-lg p-4">
          <img 
            src={previewUrl} 
            alt={filename} 
            className="max-w-full h-auto object-contain"
          />
        </div>
      );
    }

    // PDF preview
    if (mimeType === "application/pdf") {
      return (
        <iframe
          src={previewUrl}
          className="w-full h-[600px] border-0 rounded-lg"
          title={filename}
        />
      );
    }

    // Text preview
    if (mimeType?.startsWith("text/") || mimeType === "application/json" || mimeType === "application/xml") {
      return (
        <div className="max-h-[600px] overflow-auto bg-muted/20 rounded-lg p-4">
          <iframe
            src={previewUrl}
            className="w-full h-[550px] border-0"
            title={filename}
          />
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
        className="h-8 w-8 p-0"
        title="Preview"
      >
        <Eye className="h-4 w-4" />
      </Button>

      <Dialog open={previewOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold truncate pr-4">
                {filename}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDownload}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {renderPreview()}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
