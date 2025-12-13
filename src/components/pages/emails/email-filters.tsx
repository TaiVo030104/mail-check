import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Filter, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface EmailFilterValues {
  search?: string;
  from?: string;
  unread?: boolean;
  starred?: boolean;
  startDate?: Date;
  endDate?: Date;
  hasAttachments?: boolean;
  sort?: 'newest' | 'oldest';
}

interface EmailFiltersProps {
  filters: EmailFilterValues;
  onFiltersChange: (filters: EmailFilterValues) => void;
  onClearFilters: () => void;
}

export function EmailFilters({ filters, onFiltersChange, onClearFilters }: EmailFiltersProps) {
  const [localFilters, setLocalFilters] = useState<EmailFilterValues>(filters);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleSearchChange = (value: string) => {
    const updated = { ...localFilters, search: value || undefined };
    setLocalFilters(updated);
    onFiltersChange(updated);
  };

  const handleApplyFilters = () => {
    onFiltersChange({ ...localFilters, sort: localFilters.sort || 'newest' });
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    setLocalFilters({ sort: 'newest' });
    onClearFilters();
    setIsOpen(false);
  };

  const activeFiltersCount = [
    filters.from,
    filters.search,
    filters.unread ? true : undefined,
    filters.starred ? true : undefined,
    filters.startDate,
    filters.endDate,
    filters.hasAttachments ? true : undefined,
  ].filter((value) => value !== undefined && value !== '').length;

  const hasActiveFilters = activeFiltersCount > 0;

  return (
    <div className="flex items-center gap-2 p-3 md:p-4 border-b bg-background">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search emails..."
          value={localFilters.search || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9 pr-4 h-9 w-full"
          aria-label="Search emails"
        />
      </div>

      {/* Advanced Filters */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant={hasActiveFilters ? "default" : "outline"} 
            size="sm" 
            className="gap-2 h-9"
            aria-label="Open filters"
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <span className="h-5 w-5 rounded-full bg-primary-foreground text-primary text-xs flex items-center justify-center font-semibold">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Filter Emails</DialogTitle>
            <DialogDescription>
              Narrow down your search with advanced filters
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-6">
            {/* From Filter */}
            <div className="space-y-2">
              <Label htmlFor="from-filter">From</Label>
              <Input
                id="from-filter"
                type="email"
                placeholder="sender@example.com"
                value={localFilters.from || ''}
                onChange={(e) => setLocalFilters({ ...localFilters, from: e.target.value || undefined })}
              />
            </div>

            {/* Status Filters */}
            <div className="space-y-4">
              <Label>Status</Label>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="unread-filter" className="font-normal cursor-pointer">
                  Unread only
                </Label>
                <Switch
                  id="unread-filter"
                  checked={localFilters.unread || false}
                  onCheckedChange={(checked: boolean) => 
                    setLocalFilters({ ...localFilters, unread: checked ? true : undefined })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="starred-filter" className="font-normal cursor-pointer">
                  Starred only
                </Label>
                <Switch
                  id="starred-filter"
                  checked={localFilters.starred || false}
                  onCheckedChange={(checked: boolean) => 
                    setLocalFilters({ ...localFilters, starred: checked ? true : undefined })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="attachments-filter" className="font-normal cursor-pointer">
                  Has attachment
                </Label>
                <Switch
                  id="attachments-filter"
                  checked={localFilters.hasAttachments || false}
                  onCheckedChange={(checked: boolean) =>
                    setLocalFilters({ ...localFilters, hasAttachments: checked ? true : undefined })
                  }
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-3">
              <Label>Date Range</Label>
              
              <div className="space-y-2">
                <Label htmlFor="start-date" className="text-xs text-muted-foreground">
                  From
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="start-date"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !localFilters.startDate && "text-muted-foreground"
                      )}
                    >
                      {localFilters.startDate ? (
                        format(localFilters.startDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={localFilters.startDate}
                      onSelect={(date: Date | undefined) => 
                        setLocalFilters({ ...localFilters, startDate: date || undefined })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-date" className="text-xs text-muted-foreground">
                  To
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="end-date"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !localFilters.endDate && "text-muted-foreground"
                      )}
                    >
                      {localFilters.endDate ? (
                        format(localFilters.endDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={localFilters.endDate}
                      onSelect={(date: Date | undefined) => 
                        setLocalFilters({ ...localFilters, endDate: date || undefined })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Sorting */}
            <div className="space-y-2">
              <Label htmlFor="sort-order">Sort by date</Label>
              <Select
                value={localFilters.sort || 'newest'}
                onValueChange={(value: 'newest' | 'oldest') =>
                  setLocalFilters({ ...localFilters, sort: value })
                }
              >
                <SelectTrigger id="sort-order">
                  <SelectValue placeholder="Select order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleClearFilters}
              >
                <X className="mr-2 h-4 w-4" />
                Clear All
              </Button>
              <Button
                className="flex-1"
                onClick={handleApplyFilters}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Clear Search Button */}
      {filters.search && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleSearchChange('')}
          className="h-9 px-2"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
