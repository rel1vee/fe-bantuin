"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  fullName: string;
  profilePicture: string | null;
  isSeller: boolean;
  isVerified: boolean;
  major: string | null;
  batch: string | null;
  nim: string | null;
  phoneNumber: string | null;
  bio: string | null;
  avgRating: number;
  totalReviews: number;
  totalOrdersCompleted: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
  activateSellerMode: (phoneNumber: string, bio: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// FIX 1: Tambahkan fallback URL agar tidak error jika ENV belum terbaca
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5500/api";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUserProfile = useCallback(async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // FIX 2: Hanya hapus token jika server menolak (401 Unauthorized)
        if (response.status === 401) {
          console.error("Token expired or invalid, logging out...");
          localStorage.removeItem("access_token");
          setUser(null);
        } else {
          console.error(`Failed to fetch profile: ${response.statusText}`);
          // Jangan hapus user/token jika error server (500) atau jaringan
        }
        return null;
      }

      const result = await response.json();
      setUser(result.data);
      return result.data;
    } catch (error) {
      console.error("Network error fetching profile:", error);
      // Jangan hapus token di sini agar user bisa refresh halaman
      return null;
    }
  }, []);

  const initAuth = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");

      if (token) {
        // FIX 3: 'await' di sini memastikan loading tidak mati sebelum data ada
        await fetchUserProfile(token);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [fetchUserProfile]);

  useEffect(() => {
    initAuth();

    // Listener agar sinkron antar tab
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "access_token") initAuth();
    };

    const handleTokenSet = () => initAuth();

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("tokenSet", handleTokenSet);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("tokenSet", handleTokenSet);
    };
  }, [initAuth]);

  const login = () => {
    // AMBIL URL SAAT INI (Localhost atau Ngrok)
    const currentUrl = window.location.origin;

    // KIRIM SEBAGAI PARAMETER 'returnUrl'
    window.location.href = `${API_URL}/auth/google?returnUrl=${encodeURIComponent(
      currentUrl
    )}`;
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (token) {
        await fetch(`${API_URL}/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("access_token");
      setUser(null);
      router.push("/");
      router.refresh();
    }
  };

  const refreshUser = async () => {
    const token = localStorage.getItem("access_token");
    if (token) {
      setLoading(true); // Tampilkan loading saat refresh manual
      await fetchUserProfile(token);
      setLoading(false);
    }
  };

  const activateSellerMode = async (phoneNumber: string, bio: string) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("Not authenticated");

      const response = await fetch(`${API_URL}/users/activate-seller`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phoneNumber, bio }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Failed");

      // Update state user langsung
      setUser(result.data);
      router.push("/seller/dashboard");
    } catch (error) {
      console.error("Activate seller error:", error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    activateSellerMode,
    refreshUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
