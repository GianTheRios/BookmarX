import type { Metadata } from "next";
import { DM_Sans, Literata, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const literata = Literata({
  variable: "--font-literata",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BookmarX - Your Bookmarks, Beautifully Read",
  description: "Transform your X bookmarks into a Kindle-style reading experience with page-turn animations.",
  keywords: ["bookmarks", "twitter", "x", "reading", "kindle", "e-reader"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${literata.variable} ${cormorant.variable}`}>
        {children}
      </body>
    </html>
  );
}
