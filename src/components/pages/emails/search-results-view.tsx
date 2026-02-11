import { format } from "date-fns";
import { ArrowLeft, Calendar, Mail, Paperclip, Star, StarOff, User } from "lucide-react";
import { useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/loading-state";
import { cn } from "@/lib/utils";
import type { Email } from "@/types/email";
import type { SearchResult } from "@/types/search";

interface SearchResultsViewProps {
  results: SearchResult[];
  query: string;
  isLoading: boolean;
  error: Error | null;
  onBack: () => void;
  onEmailClick: (email: Email) => void;
  onToggleStar?: (emailId: string) => void;
}

export function SearchResultsView({
  results,
  query,
  isLoading,
  error,
  onBack,
  onEmailClick,
  onToggleStar,
}: SearchResultsViewProps) {
  const [starredEmails, setStarredEmails] = useState<Set<string>>(
    new Set(results.filter((r) => r.email.isStarred).map((r) => r.email.id))
  );

  const handleToggleStar = (emailId: string, currentStarred: boolean) => {
    const newStarred = !currentStarred;
    setStarredEmails((prev) => {
      const next = new Set(prev);
      if (newStarred) {
        next.add(emailId);
      } else {
        next.delete(emailId);
      }
      return next;
    });

    if (onToggleStar) {
      onToggleStar(emailId);
    }
  };

  const getMatchTypeBadge = (matchType: SearchResult["matchType"]) => {
    const variants: Record<
      SearchResult["matchType"],
      { label: string; variant: "default" | "secondary" | "outline" }
    > = {
      exact: { label: "Exact", variant: "default" },
      partial: { label: "Partial", variant: "secondary" },
      fuzzy: { label: "Fuzzy", variant: "outline" },
      semantic: { label: "Semantic", variant: "outline" },
    };

    const config = variants[matchType] || variants.partial;
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-4 border-b p-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="mr-2 size-4" />
            Back
          </Button>
          <h2 className="text-lg font-semibold">Search Results</h2>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <LoadingState message="Searching emails..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-4 border-b p-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="mr-2 size-4" />
            Back
          </Button>
          <h2 className="text-lg font-semibold">Search Results</h2>
        </div>
        <div className="flex flex-1 items-center justify-center p-4">
          <Alert variant="destructive" className="max-w-md">
            <AlertTitle>Search Error</AlertTitle>
            <AlertDescription>
              {error.message || "An error occurred while searching. Please try again."}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-4 border-b p-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="mr-2 size-4" />
            Back
          </Button>
          <h2 className="text-lg font-semibold">Search Results</h2>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <Mail className="mb-4 size-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No results found</h3>
          <p className="max-w-md text-muted-foreground">
            No emails match your search query &quot;{query}&quot;. Try different keywords or check
            your spelling.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {}
      <div className="flex items-center gap-4 border-b p-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-2 size-4" />
          Back
        </Button>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Search Results</h2>
          <p className="text-sm text-muted-foreground">
            Found {results.length} result{results.length !== 1 ? "s" : ""} for &quot;{query}&quot;
          </p>
        </div>
      </div>

      {}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {results.map((result) => {
          const isStarred = starredEmails.has(result.email.id);
          return (
            <Card
              key={result.email.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                !result.email.isRead && "border-l-4 border-l-primary"
              )}
              onClick={() => onEmailClick(result.email)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <User className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate text-sm font-medium">{result.email.from}</span>
                      {getMatchTypeBadge(result.matchType)}
                    </div>
                    <h3 className="mb-1 line-clamp-1 text-base font-semibold">
                      {result.email.subject || "(No subject)"}
                    </h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-8 shrink-0 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStar(result.email.id, isStarred);
                    }}
                    aria-label={isStarred ? "Unstar email" : "Star email"}
                  >
                    {isStarred ? (
                      <Star className="size-4 fill-yellow-500 text-yellow-500" />
                    ) : (
                      <StarOff className="size-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                  {result.email.preview || "No preview"}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="size-3" />
                    <span>{format(new Date(result.email.sentAt), "MMM d, yyyy")}</span>
                  </div>
                  {result.email.hasAttachments && (
                    <div className="flex items-center gap-1">
                      <Paperclip className="size-3" />
                      <span>Attachment</span>
                    </div>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-xs">Relevance: {result.relevanceScore}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
