"use client";

import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { Slider } from "@/components/ui/slider";
import { BorderBeam } from "@/components/magicui/border-beam";
import { SmartAutocomplete } from "@/components/SmartAutocomplete";

interface SearchInterfaceProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  companyCount: number[];
  setCompanyCount: (count: number[]) => void;
  isLoading: boolean;
  isEmailMining: boolean;
  onSearch: () => void;
}

export default function SearchInterface({
  searchQuery,
  setSearchQuery,
  companyCount,
  setCompanyCount,
  isLoading,
  isEmailMining,
  onSearch,
}: SearchInterfaceProps) {
  const handleSearch = (query: string) => {
    if (query !== searchQuery) {
      setSearchQuery(query);
    }
    onSearch();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative"
    >
      <div className="relative bg-card border border-1 rounded-xl p-3 backdrop-blur-sm shadow-xl space-y-4">
        {/* Smart Autocomplete Search */}
        <div className="space-y-2">
          <SmartAutocomplete
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={handleSearch}
            placeholder="Search for companies (e.g., investment banks in NYC)"
            isLoading={isLoading || isEmailMining}
            className="w-full"
          />
        </div>

        {/* Company Count Slider */}
        <div className="flex items-center gap-1 pb-0 mb-0 pt-1 ">
          <span className="text-xs text-muted-foreground min-w-fit">
            Companies to find:
          </span>
          <div className="flex-1">
            <Slider
              value={companyCount}
              onValueChange={setCompanyCount}
              max={20}
              min={1}
              step={1}
              className="w-full [&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
              disabled={isLoading || isEmailMining}
            />
          </div>
          <span className="text-xs font-medium min-w-[2rem] text-center bg-accent text-accent-foreground px-2 py-1 rounded">
            {companyCount[0]}
          </span>
        </div>

        {/* Status indicator */}
        {/* {(isLoading || isEmailMining) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            {isLoading ? "Searching companies..." : "Mining emails..."}
          </div>
        )} */}

        {/* Border effects with contained overflow */}
        <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
          <BorderBeam
            duration={6}
            size={300}
            colorFrom="#3b82f6"
            colorTo="#8b5cf6"
          />
          <BorderBeam
            duration={8}
            delay={2}
            size={250}
            borderWidth={1}
            colorFrom="#10b981"
            colorTo="#f59e0b"
          />
        </div>
      </div>
    </motion.div>
  );
}
