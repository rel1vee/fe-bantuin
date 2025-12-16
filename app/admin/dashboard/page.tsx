// app/admin/dashboard/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  TbWallet,
  TbTrendingUp,
  TbUser,
  TbLoader,
  TbArrowDownLeft,
  TbReceipt2,
  TbX,
  TbCoins,
  TbPackage,
} from "react-icons/tb";

interface Stats {
  totalUserBalance: number;
  totalPlatformRevenue: number;
  totalActiveUsers: number;
}

interface IncomeTransaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
  wallet: {
    user: {
      fullName: string;
      profilePicture: string | null;
    };
  };
  order: {
    title: string;
  } | null;
}

const AdminDashboardPage = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [history, setHistory] = useState<IncomeTransaction[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("/api/admin/dashboard/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Error fetching admin stats:", error);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("/api/admin/dashboard/income-history", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setHistory(data.data);
      }
    } catch (error) {
      console.error("Error fetching income history:", error);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchHistory();
  }, [fetchStats, fetchHistory]);
  
  const getTransactionIcon = (type: string) => {
    if (type === 'ESCROW_RELEASE') return <TbArrowDownLeft className="h-5 w-5 text-emerald-600" />;
    if (type === 'PAYOUT_REJECTED') return <TbX className="h-5 w-5 text-blue-600" />;
    if (type === 'DISPUTE_REFUND') return <TbX className="h-5 w-5 text-orange-600" />;
    return <TbReceipt2 className="h-5 w-5 text-gray-500" />;
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'ESCROW_RELEASE': return 'Pelepasan Dana Escrow';
      case 'PAYOUT_REJECTED': return 'Pengembalian Penarikan Ditolak';
      case 'DISPUTE_REFUND': return 'Pengembalian Dana Sengketa';
      default: return 'Transaksi Kredit';
    }
  };


  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground font-display flex items-center gap-2">
            <TbCoins className="h-7 w-7 text-primary" />
            Admin Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Ringkasan keuangan dan aktivitas utama platform
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Saldo Keseluruhan */}
          <Card className="border-2 border-primary/20 bg-linear-to-br from-primary/5 to-transparent">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Saldo Akun User Total
                </CardTitle>
                <div className="bg-primary/10 p-2 rounded-lg">
                  <TbWallet className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="h-8 w-3/4 bg-gray-200 animate-pulse rounded" />
              ) : (
                <div className="text-2xl font-bold text-primary truncate">
                  {formatCurrency(stats?.totalUserBalance || 0)}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Total dana yang tertahan di semua akun user
              </p>
            </CardContent>
          </Card>
          
          {/* Total Revenue Platform */}
          <Card className="border-2 border-green-500/20 bg-linear-to-br from-green-500/5 to-transparent">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Pendapatan Platform
                </CardTitle>
                <div className="bg-green-100 p-2 rounded-lg">
                  <TbTrendingUp className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="h-8 w-3/4 bg-gray-200 animate-pulse rounded" />
              ) : (
                <div className="text-2xl font-bold text-green-600 truncate">
                  {formatCurrency(stats?.totalPlatformRevenue || 0)}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                10% komisi dari semua order selesai (lifetime)
              </p>
            </CardContent>
          </Card>

          {/* Total Pengguna Aktif */} {/* <-- PERUBAHAN DI SINI */}
          <Card className="border-2 border-gray-500/20 bg-linear-to-br from-gray-500/5 to-transparent">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Pengguna Aktif
                </CardTitle>
                <div className="bg-gray-100 p-2 rounded-lg">
                  <TbUser className="h-5 w-5 text-gray-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="h-8 w-1/4 bg-gray-200 animate-pulse rounded" />
              ) : (
                <div className="text-2xl font-bold text-gray-600 truncate">
                  {stats?.totalActiveUsers.toLocaleString('id-ID') || 0} {/* <-- Gunakan data stats */}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Total pembeli dan penjual yang tidak di-ban
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Income History */}
        <Card className="mt-8">
            <CardHeader className="border-b">
                <CardTitle className="text-xl flex items-center gap-2">
                    <TbReceipt2 className="h-5 w-5 text-primary" />
                    Riwayat Dana Masuk (Credit)
                </CardTitle>
            </CardHeader>
            <ScrollArea className="h-[400px]">
                <CardContent className="p-0">
                    {loadingHistory ? (
                        <div className="flex flex-col items-center justify-center py-10">
                            <TbLoader className="h-8 w-8 text-primary animate-spin mb-3" />
                            <p className="text-sm text-muted-foreground">Memuat riwayat transaksi...</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            <TbPackage className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                            <p className="text-lg font-medium">Belum ada riwayat dana masuk.</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {history.map((tx) => (
                                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                                            {getTransactionIcon(tx.type)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-sm text-foreground truncate">
                                                {tx.wallet.user.fullName} ({getTransactionTypeLabel(tx.type)})
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {tx.description}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-bold text-base text-emerald-600">
                                            +{formatCurrency(tx.amount)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(tx.createdAt).toLocaleDateString("id-ID")}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </ScrollArea>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage;