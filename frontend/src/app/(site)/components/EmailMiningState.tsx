"use client";

import { motion, AnimatePresence } from "motion/react";
import { Mail, Users, Target, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { TextAnimate } from "@/components/magicui/text-animate";

const emailMessages = [
  "Becoming an email detective extraordinaire",
  "Weaving through the web for contact gold",
  "Putting on our professional networking mask",
  "Scanning LinkedIn like a social media ninja",
  "Mining for contact diamonds in the rough",
  "Precision targeting decision makers",
  "Casting email discovery spells",
  "Unlocking the vault of professional contacts",
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

interface EmailMiningStateProps {
  isEmailMining: boolean;
  progress: number;
  currentCompanyIndex: number;
  messageIndex: number;
  searchResults: {
    companies: any[];
  } | null;
  emailResults: {
    total_contacts: number;
    companies_processed: number;
  } | null;
}

export default function EmailMiningState({
  isEmailMining,
  progress,
  currentCompanyIndex,
  messageIndex,
  searchResults,
  emailResults,
}: EmailMiningStateProps) {
  return (
    <>
      {/* Email Mining State */}
      <AnimatePresence>
        {isEmailMining && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-center space-x-3">
                <motion.h3
                  initial={{ x: 0, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="text-3xl font-bold"
                >
                  Email Mining in Progress
                </motion.h3>
              </div>

              <div className="flex items-center justify-center">
                <TextAnimate
                  key={messageIndex}
                  animation="fadeIn"
                  duration={0.5}
                  className="text-black/70 dark:text-white/70 font-medium will-change-transform"
                >
                  {emailMessages[messageIndex]}
                </TextAnimate>
                <AnimatedDots />
              </div>

              <div className="text-sm text-black/60 dark:text-white/60">
                Processing company {currentCompanyIndex + 1} of{" "}
                {searchResults?.companies?.length || 0}
                {searchResults?.companies?.[currentCompanyIndex] && (
                  <div className="font-medium mt-1">
                    {searchResults.companies[currentCompanyIndex].name}
                  </div>
                )}
              </div>

              <div className="space-y-3 max-w-md mx-auto">
                <Progress value={progress} className="w-full h-2" />
                <div className="flex justify-between text-sm text-black/60 dark:text-white/60">
                  <span>Progress: {Math.round(progress)}%</span>
                  <div className="flex items-center space-x-1">
                    <Target className="w-4 h-4" />
                    <span>Finding contacts</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span className="text-sm">Scanning profiles</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-5 h-5" />
                  <span className="text-sm">Collecting emails</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email Results */}
      <AnimatePresence>
        {emailResults && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-center space-x-3">
                <CheckCircle className="size-13 text-black dark:text-white" />
                <motion.h3
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-5xl font-bold"
                >
                  Email Mining Complete!
                </motion.h3>
              </div>

              <div className="grid grid-cols-2 gap-8 max-w-md mx-auto">
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-center"
                >
                  <div className="text-3xl   font-serif">
                    {emailResults.total_contacts}
                  </div>
                  <div className="text-3xl font-serif">Contacts Found</div>
                </motion.div>
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-center"
                >
                  <div className="text-3xl font-bold text-black dark:text-white">
                    {emailResults.companies_processed}
                  </div>
                  <div className="text-sm text-black/60 dark:text-white/60">
                    Companies Processed
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
