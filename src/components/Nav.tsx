"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Instagram, Menu, X } from "lucide-react";

const links = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Events" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/calendar", label: "Calendar" },
  { href: "/team", label: "Team" },
  { href: "/merch", label: "Merch" },
  { href: "/feedback", label: "Feedback" },
];

// Secondary pages behind a "More" dropdown on desktop — the top bar
// already holds 7 links and more would overflow on laptop widths.
const moreLinks = [
  { href: "/battles", label: "Spotlight Battles" },
  { href: "/collab", label: "Collab Board" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/spotlights", label: "Spotlights" },
];

const INSTAGRAM_URL = "https://instagram.com/themusiccreativefiu";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLLIElement>(null);
  const pathname = usePathname();
  const moreActive = moreLinks.some((l) => pathname.startsWith(l.href));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  // Close the "More" dropdown on outside click or Escape.
  useEffect(() => {
    if (!moreOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [moreOpen]);

  return (
    <>
      <header
        className={`sticky top-0 z-50 border-b transition-all duration-500 ${
          scrolled
            ? "border-navy-800 bg-abyss/95 backdrop-blur-lg"
            : "border-navy-800/50 bg-abyss/70 backdrop-blur-md"
        }`}
      >
        <nav className="mx-auto flex max-w-6xl items-center px-4 py-3">
          <Link href="/" className="flex shrink-0 items-center gap-3">
            {/* PNG with real transparency (see public/charms and this file's
                sibling assets) -- the source graphic is already a circle
                inscribed in its own bounding box, so no rounded-* class is
                needed to clip it. */}
            <Image
              src="/logo-rebrand.png"
              alt="The Music Creative @ FIU"
              width={40}
              height={40}
            />
            <span className="hidden whitespace-nowrap font-display text-lg tracking-wide text-ivory sm:inline lg:hidden xl:inline">
              THE MUSIC CREATIVE
            </span>
          </Link>

          {/* Desktop bar starts at lg, not sm: measured at ~975px wide even
              before "More", so 640–1024px (tablets) used to overflow. Those
              widths get the hamburger menu instead. The wordmark hides
              between lg and xl to make room. */}
          <ul className="ml-10 hidden gap-6 text-sm font-medium lg:flex xl:gap-8">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  data-active={pathname === l.href}
                  className="nav-link-underline text-steel-light transition-colors hover:text-accent data-[active=true]:text-accent"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li ref={moreRef} className="relative">
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                aria-expanded={moreOpen}
                aria-haspopup="true"
                data-active={moreActive}
                className="inline-flex items-center gap-1 text-steel-light transition-colors hover:text-accent data-[active=true]:text-accent"
              >
                More
                <ChevronDown size={14} className={`transition-transform ${moreOpen ? "rotate-180" : ""}`} />
              </button>
              {moreOpen && (
                <ul className="absolute right-0 top-full z-50 mt-3 w-48 overflow-hidden rounded-xl border border-navy-800 bg-navy-950 py-1 shadow-lg">
                  {moreLinks.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        data-active={pathname.startsWith(l.href)}
                        className="block px-4 py-2 text-steel-light transition-colors hover:bg-navy-900 hover:text-accent data-[active=true]:text-accent"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          </ul>

          {/* ml-auto absorbs the leftover header width, pinning E-Board +
              Instagram to the right edge regardless of viewport. */}
          <div className="ml-auto hidden items-center gap-4 lg:flex">
            <Link
              href="/eboard"
              className="rounded-full border border-gold px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent transition-colors hover:bg-gold hover:text-white"
            >
              E-Board
            </Link>
            <div className="h-4 w-px bg-navy-800" />
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="text-steel-light transition-colors hover:text-accent"
            >
              <Instagram size={18} />
            </a>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            className="ml-auto text-ivory lg:hidden"
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
            className="fixed inset-0 top-[57px] z-40 overflow-y-auto bg-navy-950 lg:hidden"
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
                className="mt-2 flex flex-wrap gap-x-5 gap-y-2"
              >
                {moreLinks.map((l) => (
                  <Link key={l.href} href={l.href} className="py-1 text-lg font-semibold text-steel-light hover:text-accent">
                    {l.label}
                  </Link>
                ))}
              </motion.li>
              <motion.li
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: (links.length + 1) * 0.06 }}
                className="mt-4 flex flex-wrap items-center gap-3 border-t border-navy-800 pt-4"
              >
                <Link
                  href="/join"
                  className="inline-block rounded-full bg-gold px-4 py-1.5 text-sm font-semibold uppercase tracking-wide text-white"
                >
                  Join
                </Link>
                <Link
                  href="/eboard"
                  className="inline-block rounded-full border border-gold px-4 py-1.5 text-sm font-semibold uppercase tracking-wide text-accent"
                >
                  E-Board
                </Link>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="text-steel-light transition-colors hover:text-accent"
                >
                  <Instagram size={22} />
                </a>
              </motion.li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
