"use client";

import { motion } from "motion/react";

const sphereConfigs = [
  {
    size: "w-96 h-96",
    position: "-top-32 -left-32",
    gradientStyle: {
      background: `radial-gradient(circle at 40% 40%, 
        #3b82f6, #1e40af)`,
    },
    delay: 0,
    duration: 40,
  },
  {
    size: "w-80 h-80",
    position: "-top-20 -right-20",
    gradientStyle: {
      background: `radial-gradient(circle at 30% 30%, 
        #f59e0b, #b45309)`,
    },
    delay: 5,
    duration: 35,
  },
  {
    size: "w-[28rem] h-[28rem]",
    position: "-bottom-40 -left-40",
    gradientStyle: {
      background: `radial-gradient(circle at 35% 35%, 
        #10b981, #065f46)`,
    },
    delay: 2,
    duration: 45,
  },
  {
    size: "w-72 h-72",
    position: "-bottom-16 -right-16",
    gradientStyle: {
      background: `radial-gradient(circle at 40% 40%, 
        #ef4444, #991b1b)`,
    },
    delay: 7,
    duration: 38,
  },
  {
    size: "w-64 h-64",
    position: "top-0 -left-20",
    gradientStyle: {
      background: `radial-gradient(circle at 45% 45%, 
        #06b6d4, #0e7490)`,
    },
    delay: 3,
    duration: 42,
  },
  {
    size: "w-88 h-88",
    position: "bottom-0 -right-24",
    gradientStyle: {
      background: `radial-gradient(circle at 30% 30%, 
        #a855f7, #6b21a8)`,
    },
    delay: 6,
    duration: 50,
  },
];

export default function GradientSpheres() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {sphereConfigs.map((sphere, index) => (
        <motion.div
          key={index}
          className={`absolute ${sphere.size} ${sphere.position} rounded-full opacity-60`}
          style={sphere.gradientStyle}
          initial={{ opacity: 0.3, scale: 0.8 }}
          animate={{
            scale: [0.95, 1.05, 0.95],
            opacity: [0.4, 0.7, 0.4],
            x: [0, 15, -10, 0],
            y: [0, -10, 8, 0],
            rotate: [0, 360],
          }}
          transition={{
            duration: sphere.duration,
            delay: sphere.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
