import { useState } from 'react';
import { ArrowLeft, Mail, Star, StarOff, Paperclip, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/loading-state';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format } from 'date-fns';
import { Email } from '@/services/email';
import { SearchResult } from '@/services/search';
import { cn } from '@/lib/utils';

interface SearchResultsViewProps {
  results: SearchResult[];
  query: string;
  isLoading: boolean;
  error: Error | null;
  onBack: () => void;
  onEmailClick: (email: Email) => void;
  onToggleStar?: (emailId: string, isStarred: boolean) => void;
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
    new Set(results.filter((r) => r.email.isStarred).map((r) => r.email.id)),
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
      onToggleStar(emailId, newStarred);
    }
  };

  const getMatchTypeBadge = (matchType: SearchResult['matchType']) => {
    const variants: Record<SearchResult['matchType'], { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      exact: { label: 'Exact', variant: 'default' },
      partial: { label: 'Partial', variant: 'secondary' },
      fuzzy: { label: 'Fuzzy', variant: 'outline' },
      semantic: { label: 'Semantic', variant: 'outline' },
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
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-4 p-4 border-b">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h2 className="text-lg font-semibold">Search Results</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <LoadingState message="Searching emails..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-4 p-4 border-b">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h2 className="text-lg font-semibold">Search Results</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <Alert variant="destructive" className="max-w-md">
            <AlertTitle>Search Error</AlertTitle>
            <AlertDescription>
              {error.message || 'An error occurred while searching. Please try again.'}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-4 p-4 border-b">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h2 className="text-lg font-semibold">Search Results</h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <Mail className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No results found</h3>
          <p className="text-muted-foreground max-w-md">
            No emails match your search query &quot;{query}&quot;. Try different keywords or check
            your spelling.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Search Results</h2>
          <p className="text-sm text-muted-foreground">
            Found {results.length} result{results.length !== 1 ? 's' : ''} for &quot;{query}&quot;
          </p>
        </div>
      </div>

      {/* Results List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {results.map((result) => {
          const isStarred = starredEmails.has(result.email.id);
          return (
            <Card
              key={result.email.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                !result.email.isRead && 'border-l-4 border-l-primary',
              )}
              onClick={() => onEmailClick(result.email)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium text-sm truncate">{result.email.from}</span>
                      {getMatchTypeBadge(result.matchType)}
                    </div>
                    <h3 className="font-semibold text-base mb-1 line-clamp-1">
                      {result.email.subject || '(No subject)'}
                    </h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStar(result.email.id, isStarred);
                    }}
                    aria-label={isStarred ? 'Unstar email' : 'Star email'}
                  >
                    {isStarred ? (
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    ) : (
                      <StarOff className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {result.email.preview || result.email.body?.substring(0, 150) || 'No preview'}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(result.email.sentAt), 'MMM d, yyyy')}</span>
                  </div>
                  {result.email.hasAttachments && (
                    <div className="flex items-center gap-1">
                      <Paperclip className="h-3 w-3" />
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

