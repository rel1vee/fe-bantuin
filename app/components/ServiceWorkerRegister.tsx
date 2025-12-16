"use client";

import { useEffect } from "react";
import { toast } from "sonner";

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, "+")
        .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function ServiceWorkerRegister() {
    useEffect(() => {
        async function registerAndSubscribe() {
            if (
                "serviceWorker" in navigator &&
                "PushManager" in window &&
                process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
            ) {
                try {
                    const registration = await navigator.serviceWorker.register("/sw.js");
                    console.log(
                        "Service Worker registered with scope:",
                        registration.scope
                    );

                    // Wait for service worker to be active
                    await navigator.serviceWorker.ready;

                    // Get token from localStorage
                    const token = localStorage.getItem("access_token");
                    if (!token) return;

                    const subscription = await registration.pushManager.getSubscription();

                    if (!subscription) {
                        if (Notification.permission !== 'denied') {
                            const newSubscription = await registration.pushManager.subscribe({
                                userVisibleOnly: true,
                                applicationServerKey: urlBase64ToUint8Array(
                                    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
                                ),
                            });

                            // Send to backend with Auth header
                            await fetch("/api/notifications/subscribe", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    "Authorization": `Bearer ${token}`
                                },
                                body: JSON.stringify(newSubscription),
                            });
                            console.log("Subscribed to push notifications");
                        }
                    } else {
                        // Resync existing subscription to ensure backend has it
                        await fetch("/api/notifications/subscribe", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${token}`
                            },
                            body: JSON.stringify(subscription),
                        }).catch(err => console.error("Failed to resync sub", err));
                    }
                } catch (error) {
                    console.error("Service Worker/Push registration failed:", error);
                }
            }
        }

        registerAndSubscribe();
    }, []);

    return null;
}
