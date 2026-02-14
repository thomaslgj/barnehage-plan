import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
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
      <body className={`${manrope.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
