"use client";

import { motion } from "framer-motion";

// Subtle fade + slide-up when the element scrolls into view. Used to wrap
// individual cards/list items on Server Component pages — the data fetch
// stays server-side, only this wrapper needs the client for the animation.
export default function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
