import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import ScrollToTop from "@/components/ScrollToTop";
import { inter, notoMalayalam, playfair } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Aiswarya Matrimony",
  description: "Aiswarya Matrimony - Find Your Perfect Match",
  authors: [{ name: "Aiswarya Matrimony" }],
  icons: [{ rel: "icon", type: "image/svg+xml", url: "/favicon.svg" }],
  openGraph: {
    title: "Aiswarya Matrimony",
    description: "Aiswarya Matrimony - Find Your Perfect Match",
    type: "website",
    images: ["/favicon.svg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aiswarya Matrimony",
    description: "Aiswarya Matrimony - Find Your Perfect Match",
    images: ["/favicon.svg"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
  themeColor: "#6B2D5C",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} ${notoMalayalam.variable}`}
    >
      <body>
        <Providers>
          <ScrollToTop />
          {children}
        </Providers>
      </body>
    </html>
  );
}
