import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import PlausibleTracker from "@/components/PlausibleTracker";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Flyt - Få flyt i hverdagen",
  description: "Den enkle familiappen som gir deg full oversikt og kontroll over barnehageuken. Planlegg levering, henting og utstyr - sammen.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="no">
      <body className={`${plusJakartaSans.variable} antialiased`}>
        <PlausibleTracker />
        {children}
      </body>
    </html>
  );
}
