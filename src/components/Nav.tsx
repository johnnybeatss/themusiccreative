"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";

const links = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Events" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/calendar", label: "Calendar" },
  { href: "/team", label: "Team" },
  { href: "/merch", label: "Merch" },
  { href: "/feedback", label: "Feedback" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        className={`sticky top-0 z-50 border-b transition-all duration-500 ${
          scrolled
            ? "border-navy-800 bg-abyss/95 backdrop-blur-lg"
            : "border-navy-800/50 bg-abyss/70 backdrop-blur-md"
        }`}
      >
        <nav className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.jpg"
              alt="The Music Creative @ FIU"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <span className="hidden font-display text-lg tracking-wide text-ivory sm:inline">
              THE MUSIC CREATIVE
            </span>
          </Link>

          <div className="hidden items-center gap-6 sm:flex">
            <ul className="flex gap-6 text-sm font-medium">
              {links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    data-active={pathname === l.href}
                    className="nav-link-underline text-steel-light transition-colors hover:text-gold data-[active=true]:text-gold"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/eboard"
              className="rounded-full border border-gold px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gold transition-colors hover:bg-gold hover:text-navy-950"
            >
              E-Board
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            className="text-ivory sm:hidden"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>
      </header>

      {/* Rendered as a sibling of <header>, not nested inside it — a fixed
          full-screen overlay nested inside a sticky-positioned ancestor has
          had rendering quirks on iOS Safari. Fades in/out via opacity only
          (no slide transform): animating `transform` on a `position: fixed`
          element is a known WebKit gotcha where the backdrop can fail to
          composite correctly, which was letting page content underneath
          show through the menu instead of being covered by bg-navy-950. */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="fixed inset-0 top-[57px] z-40 bg-navy-950 sm:hidden"
          >
            <ul className="flex flex-col gap-2 px-4 py-8">
              {links.map((l, i) => (
                <motion.li
                  key={l.href}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                >
                  <Link
                    href={l.href}
                    className="block py-3 font-display text-3xl tracking-wide text-ivory"
                  >
                    {l.label}
                  </Link>
                </motion.li>
              ))}
              <motion.li
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: links.length * 0.06 }}
                className="mt-4 border-t border-navy-800 pt-4"
              >
                <Link
                  href="/eboard"
                  className="inline-block rounded-full border border-gold px-4 py-1.5 text-sm font-semibold uppercase tracking-wide text-gold"
                >
                  E-Board
                </Link>
              </motion.li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
