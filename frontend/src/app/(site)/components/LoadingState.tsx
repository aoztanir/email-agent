"use client";

import { motion, AnimatePresence } from "motion/react";
import { TextAnimate } from "@/components/magicui/text-animate";

const playfulMessages = [
  "Working on your request",
  "Processing your search",
  "Gathering business intelligence", 
  "Analyzing company data",
  "Searching through databases",
  "Compiling your results",
  "Almost ready with your data",
  "Finalizing your search results",
];

const AnimatedDots = () => (
  <span className="inline-flex space-x-1 ml-2">
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        className="w-1 h-1 bg-current rounded-full"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          delay: i * 0.2,
          ease: "easeInOut",
        }}
      />
    ))}
  </span>
);

interface LoadingStateProps {
  isLoading: boolean;
  messageIndex: number;
}

export default function LoadingState({ isLoading, messageIndex }: LoadingStateProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="text-center"
        >
          <div className="space-y-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
              className="w-8 h-8 border-2 border-black/20 dark:border-white/20 border-t-black dark:border-t-white rounded-full mx-auto"
            />
            <div className="flex items-center justify-center">
              <TextAnimate
                key={messageIndex}
                animation="fadeIn"
                duration={0.5}
                className="text-muted-foreground font-medium will-change-transform"
              >
                {playfulMessages[messageIndex]}
              </TextAnimate>
              <AnimatedDots />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}