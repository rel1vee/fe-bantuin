"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      localStorage.setItem("access_token", token);
      // Set flag in sessionStorage to indicate we're coming from auth callback
      sessionStorage.setItem("fromAuthCallback", "true");
      window.dispatchEvent(new Event("tokenSet"));

      // Use hard redirect with a small delay to ensure localStorage is saved
      setTimeout(() => {
        // Force full page reload to ensure AuthContext is re-initialized
        window.location.href = "/";
      }, 300);
    } else {
      router.push("/auth/error");
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100">
      <div className="text-center space-y-6">
        <div className="w-16 h-16 mx-auto border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <div>
          <h2 className="text-xl font-semibold text-gray-700">Authenticating...</h2>
          <p className="text-sm text-gray-500 mt-2">Please wait a moment</p>
        </div>
      </div>
    </div>
  );
}
