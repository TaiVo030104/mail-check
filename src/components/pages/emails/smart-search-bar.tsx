import { format, subDays } from "date-fns";
import { Calendar, Hash, Loader2, Mail, Paperclip, Search, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDebounce } from "use-debounce";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { searchService } from "@/services/search";
import type { Email } from "@/types/email";
import type { SearchResult } from "@/types/search";

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
  const [suggestions, setSuggestions] = useState<{ text: string; type: "contact" | "keyword" }[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filters, setFilters] = useState({
    hasAttachments: false,
    last7Days: false,
    fromMe: false,
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (query.length >= 2) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
      setSearchResults([]);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query]);

  useEffect(() => {
    if (query.length >= 2 && query.length < 3) {
      setIsLoadingSuggestions(true);
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
          setShowSuggestions(true);
        })
        .catch(() => {
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

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      setIsLoading(true);
      searchService
        .search(debouncedQuery, folder, 10, true)
        .then((response) => {
          let results = response.results || [];

          if (filters.hasAttachments) {
            results = results.filter((r) => r.email.hasAttachments);
          }
          if (filters.last7Days) {
            const sevenDaysAgo = subDays(new Date(), 7);
            results = results.filter((r) => new Date(r.email.sentAt) >= sevenDaysAgo);
          }
          if (filters.fromMe) {
            results = results.filter((r) => r.email.folder === "sent");
          }

          setSearchResults(results);
          setShowSuggestions(false);
        })
        .catch(() => {
          setSearchResults([]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setSearchResults([]);
    }
  }, [debouncedQuery, folder, filters]);

  const handleInputChange = (value: string) => {
    setQuery(value);
    setSelectedIndex(-1);
  };

  const handleSelectSuggestion = (suggestion: { text: string; type: "contact" | "keyword" }) => {
    setQuery(suggestion.text);
    setShowSuggestions(false);
    setSuggestions([]);

    // trigger search if debounced query differs
    if (debouncedQuery !== suggestion.text) {
      setQuery(suggestion.text);
    }
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

  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [selectedIndex]);

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
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
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
          {isLoading && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="size-6 p-0"
              aria-label="Clear search"
            >
              <X className="size-3" />
            </Button>
          )}
        </div>
      </div>

      {}
      {isOpen && showSuggestions && suggestions.length > 0 && query.length >= 2 && (
        <div
          ref={resultsRef}
          className="absolute z-[100] mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover shadow-lg"
          role="listbox"
        >
          {isLoadingSuggestions ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <Loader2 className="mx-auto mb-2 size-4 animate-spin" />
              Đang tải gợi ý...
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
                  <User className="size-4 shrink-0 text-muted-foreground" />
                ) : (
                  <Hash className="size-4 shrink-0 text-muted-foreground" />
                )}
                <span className="flex-1 truncate">{suggestion.text}</span>
                <span className="text-xs capitalize text-muted-foreground">
                  {suggestion.type === "contact" ? "Liên hệ" : "Từ khóa"}
                </span>
              </button>
            ))
          )}
        </div>
      )}

      {}
      {isOpen && !showSuggestions && query.length >= 2 && (
        <div
          ref={resultsRef}
          className="absolute z-[100] mt-1 max-h-[600px] w-full overflow-hidden rounded-md border bg-popover shadow-lg"
          role="listbox"
        >
          {}
          <div className="flex flex-wrap gap-2 border-b p-3">
            <Button
              variant={filters.hasAttachments ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters((f) => ({ ...f, hasAttachments: !f.hasAttachments }))}
              className="h-8 text-xs"
            >
              Chứa tệp đính kèm
            </Button>
            <Button
              variant={filters.last7Days ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters((f) => ({ ...f, last7Days: !f.last7Days }))}
              className="h-8 text-xs"
            >
              7 ngày qua
            </Button>
            <Button
              variant={filters.fromMe ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters((f) => ({ ...f, fromMe: !f.fromMe }))}
              className="h-8 text-xs"
            >
              Từ tôi
            </Button>
          </div>

          {}
          <div className="max-h-[400px] overflow-auto">
            {isLoading && searchResults.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                <Loader2 className="mx-auto mb-2 size-4 animate-spin" />
                Đang tìm kiếm...
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                <Mail className="mx-auto mb-2 size-6 opacity-50" />
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
                    <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{result.email.from}</span>
                        {!result.email.isRead && (
                          <span className="size-2 shrink-0 rounded-full bg-primary" />
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
                          <Calendar className="size-3" />
                          <span>{format(new Date(result.email.sentAt), "dd/MM/yyyy")}</span>
                        </div>
                        {result.email.hasAttachments && (
                          <div className="flex items-center gap-1">
                            <Paperclip className="size-3" />
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

          {}
          <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Search className="size-3" />
              <span>Mọi kết quả tìm kiếm cho "{debouncedQuery}"</span>
            </div>
            <span className="text-xs">Nhấn ENTER</span>
          </div>
        </div>
      )}
    </div>
  );
}
