"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import PublicLayout from "@/components/layouts/PublicLayout";
import Hero from "@/components/Hero";

export default function HomePage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if this is a redirect from OAuth callback
    // If there's a token in localStorage but page just loaded, ensure refresh
    const checkAndRefresh = () => {
      const token = localStorage.getItem("access_token");
      const fromAuth = sessionStorage.getItem("fromAuthCallback");
      const hasRefreshed = sessionStorage.getItem("hasRefreshedAfterAuth");
      
      // If we have a token and just came from auth callback, but haven't refreshed yet
      if (token && fromAuth && !hasRefreshed) {
        // Mark that we've refreshed to prevent infinite loop
        sessionStorage.setItem("hasRefreshedAfterAuth", "true");
        // Clear the fromAuth flag
        sessionStorage.removeItem("fromAuthCallback");
        
        // Small delay to ensure everything is ready, then reload
        setTimeout(() => {
          window.location.reload();
        }, 100);
      } else if (hasRefreshed) {
        // After refresh, clean up the flag
        sessionStorage.removeItem("hasRefreshedAfterAuth");
        // Dispatch event to ensure AuthContext picks up the token
        window.dispatchEvent(new Event("tokenSet"));
      }
    };

    checkAndRefresh();
  }, [searchParams]);

  return (
    <PublicLayout>
      <Hero />
    </PublicLayout>
  );
}
