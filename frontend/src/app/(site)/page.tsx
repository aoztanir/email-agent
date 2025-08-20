"use client";

import { useRef } from "react";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { DotPattern } from "@/components/magicui/dot-pattern";
import { cn } from "@/lib/utils";
import WelcomeSection from "./components/WelcomeSection";
import SimpleSearchCard from "./components/SimpleSearchCard";
import SimpleSearchResults from "./components/SimpleSearchResults";
import CompanyDetailsModal from "./components/CompanyDetailsModal";
import { useSearchStore } from "@/store/searchStore";

export default function MainPage() {
  const hasSearched = useSearchStore((state) => state.hasSearched);
  const inputRef = useRef<HTMLDivElement>(null);

  return (
    <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white relative">
      <DotPattern
        width={32}
        height={32}
        className={cn(
          "[mask-image:radial-gradient(600px_circle_at_center,white,transparent)]"
        )}
      />


      <div className="absolute top-6 right-6 z-30">
        <ModeToggle />
      </div>

      {hasSearched && (
        <div className="relative z-10 pt-20 pb-32">
          <div className="w-full max-w-7xl mx-auto px-4">
            <SimpleSearchResults />
          </div>
        </div>
      )}

      <div
        ref={inputRef}
        className={`${
          hasSearched
            ? "fixed bottom-4 left-1/2 transform -translate-x-1/2"
            : "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        } w-full max-w-3xl px-4 z-20 transition-all duration-500 ease-in-out`}
      >
        <WelcomeSection hasSearched={hasSearched} />
        <SimpleSearchCard />
      </div>
      
      <CompanyDetailsModal />
    </main>
  );
}