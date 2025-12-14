import { useState, useEffect, useRef } from "react";
import { Search, X, Mail, Loader2, Calendar, Paperclip } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDebounce } from "use-debounce";
import { searchService, SearchResult } from "@/services/search";
import { Email } from "@/services/email";
import { format } from "date-fns";

interface SmartSearchBarProps {
  onSearch: (query: string) => void;
  onEmailClick?: (email: Email) => void;
  onClose?: () => void;
  initialQuery?: string;
  className?: string;
  folder?: string;
}

export function SmartSearchBar({
  onSearch,
  onEmailClick,
  onClose,
  initialQuery = "",
  className,
  folder,
}: SmartSearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery] = useDebounce(query, 300);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-focus when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Show dropdown when query is long enough
  useEffect(() => {
    if (query.length >= 2) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
      setSearchResults([]);
    }
  }, [query]);

  // Fetch search results when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      setIsLoading(true);
      searchService
        .search(debouncedQuery, folder, 10, true)
        .then((response) => {
          setSearchResults(response.results || []);
        })
        .catch((error) => {
          console.error("Error fetching search results:", error);
          setSearchResults([]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setSearchResults([]);
    }
  }, [debouncedQuery, folder]);

  const handleInputChange = (value: string) => {
    setQuery(value);
    setSelectedIndex(-1);
  };

  const handleSelectEmail = (result: SearchResult) => {
    setIsOpen(false);
    inputRef.current?.blur();
    if (onEmailClick) {
      onEmailClick(result.email);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || searchResults.length === 0) {
      if (e.key === "Enter" && query.trim()) {
        onSearch(query.trim());
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          handleSelectEmail(searchResults[selectedIndex]);
        } else if (query.trim()) {
          onSearch(query.trim());
        }
        break;
      case "Escape":
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleClear = () => {
    setQuery("");
    setSearchResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
    if (onClose) {
      onClose();
    }
  };

  // Scroll selected result into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [selectedIndex]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node) && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="search"
          placeholder="Search emails, contacts, keywords..."
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.length >= 2) {
              setIsOpen(true);
            }
          }}
          className="h-9 w-full pl-9 pr-20"
          aria-label="Search emails"
          aria-expanded={isOpen}
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

      {/* Search Results Dropdown */}
      {isOpen && query.length >= 2 && (
        <div
          ref={resultsRef}
          className="absolute z-[100] mt-1 max-h-96 w-full overflow-auto rounded-md border bg-popover shadow-lg"
          role="listbox"
        >
          {isLoading && searchResults.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <Loader2 className="mx-auto mb-2 h-4 w-4 animate-spin" />
              Đang tìm kiếm...
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <Mail className="mx-auto mb-2 h-6 w-6 opacity-50" />
              <p>Không tìm thấy kết quả nào</p>
              <p className="mt-1 text-xs">Thử tìm kiếm với từ khóa khác</p>
            </div>
          ) : (
            searchResults.map((result, index) => (
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
                      <span className="truncate text-sm font-medium">{result.email.from}</span>
                      {!result.email.isRead && (
                        <span className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    <h4 className="mb-1 line-clamp-1 text-sm font-semibold">
                      {result.email.subject || "(Không có chủ đề)"}
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
                          <span>Đính kèm</span>
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
    </div>
  );
}
