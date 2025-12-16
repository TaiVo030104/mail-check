import { useState, useEffect, useRef } from "react";
import { Search, X, Loader2, User, Hash, Mail, Calendar, Paperclip } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDebounce } from "use-debounce";
import { searchService, SearchResult } from "@/services/search";
import { Email } from "@/services/email";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface UnifiedSearchBarProps {
  onResultsChange: (emails: Email[], isSearching: boolean) => void;
  onEmailSelect: (email: Email) => void;
  folder: string;
  className?: string;
}

export function UnifiedSearchBar({
  onResultsChange,
  onEmailSelect,
  folder,
  className,
}: UnifiedSearchBarProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 300);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<{ text: string; type: "contact" | "keyword" }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [semanticErrorShown, setSemanticErrorShown] = useState(false);

  // Use ref to avoid re-triggering effect when callback changes
  const onResultsChangeRef = useRef(onResultsChange);
  useEffect(() => {
    onResultsChangeRef.current = onResultsChange;
  }, [onResultsChange]);

  // Fetch suggestions when query is short (2-3 chars)
  useEffect(() => {
    if (query.length >= 2 && query.length <= 3) {
      setIsLoadingSuggestions(true);
      setShowSuggestions(true);
      
      Promise.all([
        searchService.getContactSuggestions(query, 5),
        searchService.getKeywordSuggestions(query, 5),
      ])
        .then(([contacts, keywords]) => {
          const allSuggestions = [
            ...contacts.map((c) => ({ text: c, type: "contact" as const })),
            ...keywords.map((k) => ({ text: k, type: "keyword" as const })),
          ];
          setSuggestions(allSuggestions.slice(0, 8));
        })
        .catch((error) => {
          console.error("Error fetching suggestions:", error);
          setSuggestions([]);
        })
        .finally(() => {
          setIsLoadingSuggestions(false);
        });
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query]);

  // Fetch search results and update main list
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      setIsLoading(true);
      setShowSuggestions(false);
      
      searchService
        .search(debouncedQuery, folder, 50, true) // includeSemantic = true
        .then((response) => {
          const results = response.results || [];
          setSearchResults(results);
          
          // Check for semantic search errors
          if (response.metadata?.semanticSearchError && !semanticErrorShown) {
            toast({
              title: "Semantic search unavailable",
              description: "AI-powered search is currently unavailable. Using exact and fuzzy matching instead.",
              variant: "default",
            });
            setSemanticErrorShown(true);
          } else if (!response.metadata?.semanticSearchError) {
            setSemanticErrorShown(false);
          }
          
          // Update main list real-time with sorted emails (by relevanceScore)
          const emails = results.map((r) => r.email);
          onResultsChangeRef.current(emails, true);
        })
        .catch((error) => {
          console.error("Error fetching search results:", error);
          setSearchResults([]);
          onResultsChangeRef.current([], false);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setSearchResults([]);
      onResultsChangeRef.current([], false); // Reset to normal folder view
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, folder]);

  // Show dropdown when query is long enough
  useEffect(() => {
    if (query.length >= 2) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
      setSearchResults([]);
      setSuggestions([]);
    }
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        showDropdown
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showDropdown]);

  const handleInputChange = (value: string) => {
    setQuery(value);
    setSelectedIndex(-1);
  };

  const handleSelectSuggestion = (suggestion: { text: string; type: "contact" | "keyword" }) => {
    setQuery(suggestion.text);
    setShowSuggestions(false);
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const handleSelectEmail = (result: SearchResult) => {
    console.log('Selected email from search:', result.email);
    console.log('Email ID:', result.email?.id);
    setShowDropdown(false);
    onEmailSelect(result.email);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const totalItems = showSuggestions ? suggestions.length : searchResults.length;
    
    if (!showDropdown || totalItems === 0) {
      if (e.key === "Enter" && query.trim()) {
        // Enter pressed - stop loading, keep showing results in main view, close dropdown
        e.preventDefault();
        setIsLoading(false);
        setShowDropdown(false);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          if (showSuggestions && selectedIndex < suggestions.length) {
            handleSelectSuggestion(suggestions[selectedIndex]);
          } else if (!showSuggestions && selectedIndex < searchResults.length) {
            handleSelectEmail(searchResults[selectedIndex]);
          }
        } else {
          // No selection, just close dropdown and show all results in main view
          setShowDropdown(false);
        }
        break;
      case "Escape":
        setShowDropdown(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleClear = () => {
    setQuery("");
    setSearchResults([]);
    setSuggestions([]);
    setShowDropdown(false);
    onResultsChangeRef.current([], false); // Reset to folder view
    inputRef.current?.focus();
  };

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && dropdownRef.current) {
      const selectedElement = dropdownRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [selectedIndex]);

  const topResults = searchResults.slice(0, 10); // Show top 10 in dropdown

  return (
    <div ref={containerRef} className={cn("relative flex-1", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search emails (AI-powered: semantic, fuzzy, exact)..."
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.length >= 2) {
              setShowDropdown(true);
            }
          }}
          className="h-9 w-full pl-9 pr-20"
          aria-label="Search emails"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-6 w-6 p-0"
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Dropdown with suggestions or results */}
      {showDropdown && query.length >= 2 && (
        <div
          ref={dropdownRef}
          className="absolute z-[100] mt-1 max-h-[500px] w-full overflow-hidden rounded-md border bg-popover shadow-lg"
          role="listbox"
        >
          {/* Suggestions Section */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="max-h-[200px] overflow-auto">
              <div className="border-b bg-muted/50 px-3 py-2 text-xs font-semibold text-muted-foreground">
                💡 Suggestions
              </div>
              {isLoadingSuggestions ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  <Loader2 className="mx-auto mb-2 h-4 w-4 animate-spin" />
                  Loading suggestions...
                </div>
              ) : (
                suggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.type}-${suggestion.text}-${index}`}
                    type="button"
                    onClick={() => handleSelectSuggestion(suggestion)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      "flex w-full items-center gap-2 border-b px-4 py-2 text-left text-sm last:border-b-0 hover:bg-accent focus:bg-accent focus:outline-none",
                      selectedIndex === index && "bg-accent"
                    )}
                    role="option"
                    aria-selected={selectedIndex === index}
                  >
                    {suggestion.type === "contact" ? (
                      <User className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    ) : (
                      <Hash className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    )}
                    <span className="flex-1 truncate">{suggestion.text}</span>
                    <span className="text-xs capitalize text-muted-foreground">
                      {suggestion.type === "contact" ? "Contact" : "Keyword"}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Search Results Section */}
          {!showSuggestions && query.length >= 2 && (
            <div className="max-h-[400px] overflow-auto">
              <div className="border-b bg-muted/50 px-3 py-2 text-xs font-semibold text-muted-foreground">
                📧 Top Results (sorted by relevance)
              </div>
              {isLoading && topResults.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  <Loader2 className="mx-auto mb-2 h-4 w-4 animate-spin" />
                  Searching...
                </div>
              ) : topResults.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  <Mail className="mx-auto mb-2 h-6 w-6 opacity-50" />
                  <p>No results found</p>
                  <p className="mt-1 text-xs">Try different keywords</p>
                </div>
              ) : (
                topResults.map((result, index) => (
                  <button
                    key={result.email.id}
                    type="button"
                    onClick={() => handleSelectEmail(result)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      "w-full border-b px-4 py-3 text-left last:border-b-0 hover:bg-accent focus:bg-accent focus:outline-none",
                      selectedIndex === index && "bg-accent",
                      !result.email.isRead && "bg-muted/50"
                    )}
                    role="option"
                    aria-selected={selectedIndex === index}
                  >
                    <div className="flex items-start gap-3">
                      <Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="truncate text-sm font-medium">
                            {result.email.from}
                          </span>
                          {!result.email.isRead && (
                            <span className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                          )}
                        </div>
                        <h4 className="mb-1 line-clamp-1 text-sm font-semibold">
                          {result.email.subject || "(No subject)"}
                        </h4>
                        <p className="mb-2 line-clamp-1 text-xs text-muted-foreground">
                          {result.email.preview || ""}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(result.email.sentAt), "dd/MM/yyyy")}</span>
                          </div>
                          {result.email.hasAttachments && (
                            <div className="flex items-center gap-1">
                              <Paperclip className="h-3 w-3" />
                              <span>Attachment</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Footer */}
          {!showSuggestions && searchResults.length > 0 && (
            <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Search className="h-3 w-3" />
                <span>
                  Showing {topResults.length} of {searchResults.length} results for "{debouncedQuery}"
                </span>
              </div>
              <span className="text-xs">
                <kbd className="rounded bg-muted px-1 py-0.5">Enter</kbd> for full list
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
