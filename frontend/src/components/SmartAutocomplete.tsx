"use client";

import * as React from "react";
import {
  Search,
  Clock,
  TrendingUp,
  Lightbulb,
  MapPin,
  Building,
  Users,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  autocompleteService,
  SearchSuggestion,
} from "@/lib/autocomplete-service";

interface SmartAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  isLoading?: boolean;
}

export function SmartAutocomplete({
  value,
  onChange,
  onSearch,
  placeholder = "Search for companies...",
  className,
  isLoading = false,
}: SmartAutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Get suggestions based on current value
  const suggestions = React.useMemo(() => {
    return autocompleteService.getSuggestions(value, 12);
  }, [value]);

  // Get smart completions for partial queries
  const completions = React.useMemo(() => {
    if (value.trim() && value.length > 2) {
      return autocompleteService.getSmartCompletions(value);
    }
    return [];
  }, [value]);

  // Combine suggestions and completions
  const allOptions = React.useMemo(() => {
    const options: Array<
      SearchSuggestion & { type: "suggestion" | "completion" }
    > = [];

    // Add completions first (they're more specific)
    completions.forEach((comp) =>
      options.push({ ...comp, type: "completion" })
    );

    // Add regular suggestions
    suggestions.forEach((sugg) => {
      // Avoid duplicates
      if (!options.find((opt) => opt.text === sugg.text)) {
        options.push({ ...sugg, type: "suggestion" });
      }
    });

    return options;
  }, [suggestions, completions]);

  const getCategoryIcon = (category: SearchSuggestion["category"]) => {
    switch (category) {
      case "recent":
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case "popular":
        return <TrendingUp className="h-4 w-4 text-primary" />;
      case "starter":
        return <Lightbulb className="h-4 w-4 text-primary" />;
      case "location":
        return <MapPin className="h-4 w-4 text-primary" />;
      case "industry":
        return <Building className="h-4 w-4 text-primary" />;
      case "company_type":
        return <Users className="h-4 w-4 text-primary" />;
      default:
        return <Search className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getCategoryLabel = (category: SearchSuggestion["category"]) => {
    switch (category) {
      case "recent":
        return "Recent";
      case "popular":
        return "Popular";
      case "starter":
        return "Suggested";
      case "location":
        return "Location";
      case "industry":
        return "Industry";
      case "company_type":
        return "Type";
      default:
        return "";
    }
  };

  const handleSelect = (option: SearchSuggestion, event?: React.MouseEvent) => {
    console.log('Selecting:', option.text);
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    onChange(option.text);
    setOpen(false);
    autocompleteService.addToRecentSearches(option.text);
    onSearch(option.text);
  };

  const handleSearch = () => {
    if (value.trim()) {
      autocompleteService.addToRecentSearches(value.trim());
      onSearch(value.trim());
      setOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !open) {
      handleSearch();
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  };

  // Categorize options for better display
  const categorizedOptions = React.useMemo(() => {
    const categories: Record<string, typeof allOptions> = {};

    allOptions.forEach((option) => {
      const key =
        option.type === "completion" ? "completions" : option.category;
      if (!categories[key]) {
        categories[key] = [];
      }
      categories[key].push(option);
    });

    return categories;
  }, [allOptions]);

  // Click outside to close
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        open &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [open]);

  const renderGroup = (title: string, icon: React.ReactNode, options: typeof allOptions, isCompletion = false) => {
    if (!options.length) return null;

    return (
      <div key={title}>
        <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b flex items-center gap-2">
          {icon}
          {title}
        </div>
        {options.map((option) => (
          <div
            key={option.id}
            onClick={(e) => handleSelect(option, e)}
            onMouseDown={(e) => e.preventDefault()}
            className={cn(
              "flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-accent transition-colors",
              isCompletion && "border-l-2 border-primary"
            )}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {option.icon ? (
                <span className="text-lg">{option.icon}</span>
              ) : (
                getCategoryIcon(option.category)
              )}

              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {option.text}
                </div>
                {option.description && (
                  <div className="text-xs text-muted-foreground truncate">
                    {option.description}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isCompletion && (
                <Badge variant="secondary" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Smart
                </Badge>
              )}

              {!isCompletion && (
                <Badge variant="outline" className="text-xs">
                  {getCategoryLabel(option.category)}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <Popover open={open} modal={false}>
        <PopoverTrigger asChild>
          <div 
            className="relative cursor-text w-full"
            onClick={() => {
              setOpen(true);
              setTimeout(() => {
                if (inputRef.current) {
                  inputRef.current.focus();
                }
              }, 0);
            }}
          >
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={() => {
                if (!open) setOpen(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full pr-12 border-0 shadow-none focus:ring-0 text-md focus:border-none focus:ring-0 focus:outline-none cursor-text"
            />
            <Button
              size="sm"
              onClick={handleSearch}
              disabled={isLoading || !value.trim()}
              className="absolute right-1 top-0 h-8 px-3 transform top-1/2 -translate-y-1/2"
            >
              {isLoading ? (
                <div className="animate-spin h-4 w-4 border border-white border-t-transparent rounded-full" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        </PopoverTrigger>
        <PopoverContent 
          className="p-0" 
          align="start"
          side="bottom"
          sideOffset={8}
          style={{ width: 'var(--radix-popover-trigger-width)' }}
        >
          <div className="max-h-80 overflow-y-auto">
            {allOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">No suggestions found.</div>
            ) : (
              <>
                {/* Smart Completions */}
                {renderGroup(
                  "Smart Completions",
                  <Sparkles className="h-4 w-4" />,
                  categorizedOptions.completions || [],
                  true
                )}

                {/* Recent Searches */}
                {renderGroup(
                  "Recent Searches",
                  <Clock className="h-4 w-4" />,
                  categorizedOptions.recent || []
                )}

                {/* Suggested Searches */}
                {renderGroup(
                  "Suggested Searches",
                  <Lightbulb className="h-4 w-4" />,
                  categorizedOptions.starter || []
                )}

                {/* Popular Searches */}
                {renderGroup(
                  "Popular Searches",
                  <TrendingUp className="h-4 w-4" />,
                  categorizedOptions.popular || []
                )}

                {/* Industries */}
                {renderGroup(
                  "Industries",
                  <Building className="h-4 w-4" />,
                  categorizedOptions.industry || []
                )}

                {/* Locations */}
                {renderGroup(
                  "Locations",
                  <MapPin className="h-4 w-4" />,
                  categorizedOptions.location || []
                )}

                {/* Company Types */}
                {renderGroup(
                  "Company Types",
                  <Users className="h-4 w-4" />,
                  categorizedOptions.company_type || []
                )}
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}