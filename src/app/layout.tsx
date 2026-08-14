import type { Metadata } from "next";
import { Anton, Inter } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "The Music Creative @ FIU",
  description:
    "A student-led community for producers, artists, DJs, songwriters, and music industry pros at FIU.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${anton.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-navy-950 font-sans text-ivory antialiased">
        <Nav />
        <main className="relative mx-auto max-w-4xl px-4 py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
