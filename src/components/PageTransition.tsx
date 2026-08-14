"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

// Subtle fade + slide-up on route change. Next.js App Router doesn't give
// AnimatePresence a stable place to run true exit animations across route
// changes without extra plumbing (template.tsx, etc.) — this keeps things
// simple with an enter-only transition keyed by pathname, which is enough
// to make navigation feel intentional without fighting the framework.
export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}
