import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Kdam_Thmor_Pro, Manrope } from "next/font/google";
import { Providers } from "@/components/providers/Providers";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

const kdamThmorPro = Kdam_Thmor_Pro({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-kdam",
  display: "swap",
});

export const metadata: Metadata = {
  title: "wham",
  description: "Rotating savings circles, on-chain.",
  icons: {
    other: [
      {
        rel: "mask-icon",
        url: "/brand/logo-mono.svg",
        color: "#1B8B85",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#1B8B85",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${ibmPlexMono.variable} ${kdamThmorPro.variable}`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
