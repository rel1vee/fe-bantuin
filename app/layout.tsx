import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { ChatFloatingWindow } from "@/components/chat/ChatFloatingWindow";
import localFont from "next/font/local";
import { Toaster } from "@/components/ui/sonner";

import { ServiceWorkerRegister } from "@/app/components/ServiceWorkerRegister";
import { PWAInstallPrompt } from "@/components/pwa/PWAInstallPrompt";

const mattone = localFont({
  src: [
    {
      path: "../public/fonts/mattone/Mattone-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/mattone/Mattone-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/mattone/Mattone-Black.woff2",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-mattone",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bantuin: Marketplace Jasa Mahasiswa UIN Suska Riau",
  description:
    "Platform marketplace jasa yang menghubungkan mahasiswa UIN Suska Riau dengan peluang kerja freelance dan proyek akademik.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${mattone.variable} ${outfit.variable} antialiased`}>
        <AuthProvider>
          <ChatProvider>
            {children}
            <ChatFloatingWindow />
            <PWAInstallPrompt />
            <Toaster position="top-right" />
            <ServiceWorkerRegister />
          </ChatProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
