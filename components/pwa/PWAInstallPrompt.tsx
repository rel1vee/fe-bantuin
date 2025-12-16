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
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;

        if (isStandalone) {
            return; // Already installed
        }

        const handleBeforeInstallPrompt = (e: any) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI notify the user they can install the PWA
            setShowPrompt(true);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        // For iOS, simple check if it's not standalone to show instructions
        // Note: iOS doesn't support beforeinstallprompt, so we just show it if it's iOS and not standalone
        if (isIosDevice && !isStandalone) {
            // Ideally trigger this based on user engagement or timer, but for now show it
            // We can use a different state for iOS instructions if needed, but reusing showPrompt requires care 
            // as iOS creates manual install flow.
            // For now, let's just focus on Android/Desktop install prompt event.
            setShowPrompt(true);
        }

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (isIOS) {
            // iOS doesn't support programmatic install. 
            // We usually show a drawer telling them to tap "Share" -> "Add to Home Screen"
            // For simplicity reusing the same UI but maybe just show alert or better UI.
            alert("Untuk menginstall di iOS:\n1. Tap tombol Share (Kotak dengan panah)\n2. Pilih 'Add to Home Screen' atau 'Tambah ke Layar Utama'");
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
    };

    const handleDismiss = () => {
        setShowPrompt(false);
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
                            <h3 className="font-semibold text-foreground">Install Aplikasi</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Install Bantuin untuk akses lebih cepat dan notifikasi real-time.
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
                    <Button size="sm" onClick={handleInstallClick} className="bg-primary text-primary-foreground hover:bg-primary/90">
                        {isIOS ? "Lihat Cara" : "Install Sekarang"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
