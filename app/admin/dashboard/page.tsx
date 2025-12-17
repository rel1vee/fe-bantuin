// app/admin/dashboard/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    if (type === "ESCROW_RELEASE")
      return <TbArrowDownLeft className="h-5 w-5 text-emerald-600" />;
    if (type === "PAYOUT_REJECTED")
      return <TbX className="h-5 w-5 text-blue-600" />;
    if (type === "DISPUTE_REFUND")
      return <TbX className="h-5 w-5 text-orange-600" />;
    return <TbReceipt2 className="h-5 w-5 text-gray-500" />;
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "ESCROW_RELEASE":
        return "Pelepasan Dana";
      case "PAYOUT_REJECTED":
        return "Refund Penarikan";
      case "DISPUTE_REFUND":
        return "Refund Sengketa";
      default:
        return "Credit";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-display flex items-center gap-2">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Ringkasan keuangan dan aktivitas utama platform
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
                <div
                  className="text-xl sm:text-2xl font-bold text-primary truncate"
                  title={formatCurrency(stats?.totalUserBalance || 0)}
                >
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
                <div
                  className="text-xl sm:text-2xl font-bold text-green-600 truncate"
                  title={formatCurrency(stats?.totalPlatformRevenue || 0)}
                >
                  {formatCurrency(stats?.totalPlatformRevenue || 0)}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Total komisi dari semua order selesai (lifetime)
              </p>
            </CardContent>
          </Card>

          {/* Total Pengguna Aktif */}
          <Card className="border-2 border-gray-500/20 bg-linear-to-br from-gray-500/5 to-transparent sm:col-span-2 md:col-span-1">
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
                <div className="text-xl sm:text-2xl font-bold text-gray-600 truncate">
                  {stats?.totalActiveUsers.toLocaleString("id-ID") || 0}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Total pembeli dan penjual yang tidak di-ban
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Income History - Horizontal Scroll Table */}
        <Card className="mt-8">
          <CardHeader className="border-b">
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <TbReceipt2 className="h-5 w-5 text-primary" />
              Riwayat Dana Masuk (Credit)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Container ini menggunakan overflow-auto agar bisa di-scroll 
                  secara horizontal (x) dan vertikal (y) jika konten melebihi batas.
                  h-[400px] membatasi tinggi tabel.
                */}
            <div className="overflow-auto h-[400px]">
              {loadingHistory ? (
                <div className="flex flex-col items-center justify-center py-10 h-full">
                  <TbLoader className="h-8 w-8 text-primary animate-spin mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Memuat riwayat transaksi...
                  </p>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <TbPackage className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-lg font-medium">
                    Belum ada riwayat dana masuk.
                  </p>
                </div>
              ) : (
                /* min-w-[800px] memaksa tabel memiliki lebar minimal 800px.
                         Jika layar < 800px (HP), browser akan menampilkan scrollbar samping.
                      */
                <table className="w-full text-sm text-center min-w-[800px]">
                  <thead className="text-xs text-gray-500 uppercase bg-muted/50 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-1 h-8 font-medium border-b w-[50px] align-middle">
                        
                      </th>
                      <th className="px-4 py-1 h-8 font-medium border-b w-[200px] align-middle">
                        User
                      </th>
                      <th className="px-4 py-1 h-8 font-medium border-b w-[150px] align-middle">
                        Tipe
                      </th>
                      <th className="px-4 py-1 h-8 font-medium border-b align-middle">
                        Keterangan
                      </th>
                      <th className="px-4 py-1 h-8 font-medium border-b w-[150px] align-middle">
                        Tanggal
                      </th>
                      <th className="px-4 py-1 h-8 font-medium border-b w-[150px] align-middle">
                        Jumlah
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {history.map((tx) => (
                      <tr
                        key={tx.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="p-1.5 bg-primary/10 rounded-md w-fit text-primary">
                            {getTransactionIcon(tx.type)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">
                            {tx.wallet.user.fullName}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-secondary/80 text-secondary-foreground text-[10px] font-medium border">
                            {getTransactionTypeLabel(tx.type)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {tx.description}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-emerald-600">
                            +{formatCurrency(tx.amount)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage;
