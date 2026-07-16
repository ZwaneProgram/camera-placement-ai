import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Sans_Thai } from "next/font/google";
import "./globals.css";

import { CartProvider } from "@/components/cart/cart-provider";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileBottomBar } from "@/components/mobile-bottom-bar";
import { Toaster } from "@/components/ui/sonner";
import { AuthSessionProvider } from "@/components/session-provider";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const plexThai = IBM_Plex_Sans_Thai({
  variable: "--font-plex-thai",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SUCCESS IT CENTER · ระบบรักษาความปลอดภัยอัจฉริยะ",
  description:
    "กล้องวงจรปิดและอุปกรณ์รักษาความปลอดภัยคุณภาพสูง พร้อมฟีเจอร์ AI ช่วยจำลองจุดติดตั้งกล้องในห้องของคุณ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${spaceGrotesk.variable} ${plexThai.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <AuthSessionProvider>
          <CartProvider>
            <SiteHeader />
            <main className="flex-1 pb-[82px] md:pb-0">{children}</main>
            <SiteFooter />
            <MobileBottomBar />
            <CartDrawer />
            <Toaster />
          </CartProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
