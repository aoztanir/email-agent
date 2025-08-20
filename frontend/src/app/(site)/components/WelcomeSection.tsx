"use client";

import { motion } from "motion/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { COLORS } from "@/constants/COLORS";

interface WelcomeSectionProps {
  hasSearched: boolean;
}

export default function WelcomeSection({ hasSearched }: WelcomeSectionProps) {
  if (hasSearched) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center mb-8"
    >
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-7xl font-bold mb-4"
      >
        Networking Reimagined.
      </motion.h1>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 items-center gap-4"
      >
        <Card className={`${COLORS.red.light_variant_with_border.class}`}>
          <CardHeader>
            <CardTitle className="text-left font-serif">
              Find contacts in seconds
            </CardTitle>
            <CardDescription className="text-left">
              Search for companies and automatically mine their contact emails
              from LinkedIn.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className={`${COLORS.amber.light_variant_with_border.class}`}>
          <CardHeader>
            <CardTitle className="text-left font-serif">
              Find contacts in seconds
            </CardTitle>
            <CardDescription className="text-left">
              Search for companies and automatically mine their contact emails
              from LinkedIn.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className={`${COLORS.emerald.light_variant_with_border.class}`}>
          <CardHeader>
            <CardTitle className="text-left font-serif">
              Find contacts in seconds
            </CardTitle>
            <CardDescription className="text-left">
              Search for companies and automatically mine their contact emails
              from LinkedIn.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className={`${COLORS.blue.light_variant_with_border.class}`}>
          <CardHeader>
            <CardTitle className="text-left font-serif">
              Find contacts in seconds
            </CardTitle>
            <CardDescription className="text-left">
              Search for companies and automatically mine their contact emails
              from LinkedIn.
            </CardDescription>
          </CardHeader>
        </Card>
      </motion.div>
    </motion.div>
  );
}
