import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google"; // AeroPrice Fonts
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const dynamic = "force-dynamic";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-display",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "AeroPrice - Flight Monitoring",
  description: "Minimalist Premium Flight Price Monitoring Dashboard",
  manifest: "/manifest.json",
  icons: { apple: "/icon.png" },
};

export const viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${manrope.variable} ${sora.variable} font-sans antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
