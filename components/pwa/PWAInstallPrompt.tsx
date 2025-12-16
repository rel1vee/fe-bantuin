"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, Share } from "lucide-react";

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const isIosDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    // Detect if already installed (standalone mode)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone;

    if (isStandalone) {
      return; // Already installed
    }

    // ✨ PERBAIKAN: Cek jika prompt sudah ditampilkan dalam 10 menit terakhir
    const lastPromptTime = localStorage.getItem(
      "pwa-install-prompt-last-shown"
    );
    const TEN_MINUTES = 5 * 60 * 1000; // 10 menit dalam millisecond

    if (lastPromptTime) {
      const timeSinceLastPrompt = Date.now() - parseInt(lastPromptTime);
      if (timeSinceLastPrompt < TEN_MINUTES) {
        // Belum 10 menit, jangan tampilkan prompt
        return;
      }
    }

    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setShowPrompt(true);
      // ✨ Simpan timestamp sekarang
      localStorage.setItem(
        "pwa-install-prompt-last-shown",
        Date.now().toString()
      );
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // For iOS, simple check if it's not standalone to show instructions
    // Note: iOS doesn't support beforeinstallprompt, so we just show it if it's iOS and not standalone
    if (isIosDevice && !isStandalone) {
      setShowPrompt(true);
      // ✨ Simpan timestamp untuk iOS juga
      localStorage.setItem(
        "pwa-install-prompt-last-shown",
        Date.now().toString()
      );
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      // iOS doesn't support programmatic install.
      // We usually show a drawer telling them to tap "Share" -> "Add to Home Screen"
      // For simplicity reusing the same UI but maybe just show alert or better UI.
      alert(
        "Untuk menginstall di iOS:\n1. Tap tombol Share (Kotak dengan panah)\n2. Pilih 'Add to Home Screen' atau 'Tambah ke Layar Utama'"
      );
      setShowPrompt(false);
      // ✨ Simpan timestamp
      localStorage.setItem(
        "pwa-install-prompt-last-shown",
        Date.now().toString()
      );
      return;
    }

    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowPrompt(false);
    // ✨ Simpan timestamp setelah user memilih
    localStorage.setItem(
      "pwa-install-prompt-last-shown",
      Date.now().toString()
    );
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // ✨ Simpan timestamp saat user tutup prompt
    localStorage.setItem(
      "pwa-install-prompt-last-shown",
      Date.now().toString()
    );
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96 animate-in slide-in-from-bottom duration-300">
      <div className="bg-white dark:bg-zinc-900 border border-border rounded-lg shadow-lg p-4 flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <div className="flex gap-3">
            <div className="bg-primary/10 p-2 rounded-md h-fit">
              <Download className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Install Aplikasi
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Install Bantuin untuk akses lebih cepat dan notifikasi
                real-time.
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground p-1"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-2 justify-end mt-1">
          <Button variant="outline" size="sm" onClick={handleDismiss}>
            Nanti Saja
          </Button>
          <Button
            size="sm"
            onClick={handleInstallClick}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isIOS ? "Lihat Cara" : "Install Sekarang"}
          </Button>
        </div>
      </div>
    </div>
  );
}
