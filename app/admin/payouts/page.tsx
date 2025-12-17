"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AdminLayout from "@/components/layouts/AdminLayout";
import RejectPayoutForm from "@/components/admin/reject-wallet/page";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TbWallet,
  TbUser,
  TbCreditCard,
  TbLoader,
  TbCheck,
  TbX,
  TbClock,
  TbCoins,
  TbAlertCircle,
  TbSparkles,
} from "react-icons/tb";

interface PayoutRequest {
  id: string;
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  requestedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
  account: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  wallet: {
    balance: number;
  };
}

const AdminPayoutsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectFormOpen, setRejectFormOpen] = useState(false);
  const [selectedPayoutId, setSelectedPayoutId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const fetchPendingPayouts = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch("/api/admin/payouts/pending", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 403) {
        console.error("Access Forbidden: User is not an admin.");
        router.push("/");
        return;
      }

      const data = await response.json();

      if (data.success) {
        setPayouts(data.data);
      }
    } catch (error) {
      console.error("Error fetching payouts:", error);
    } finally {
      setLoading(false);
    }
  }, [user, router]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchPendingPayouts();
    }
  }, [authLoading, user, fetchPendingPayouts]);

  const handleApprove = async (id: string) => {
    if (!confirm("Konfirmasi transfer dana sudah dilakukan?")) return;

    const token = localStorage.getItem("access_token");
    setProcessingId(id);

    try {
      const response = await fetch(`/api/admin/payouts/${id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        alert(data.message);
        fetchPendingPayouts();
      } else {
        alert(data.error || "Gagal menyetujui penarikan.");
      }
    } catch (error) {
      alert("Terjadi kesalahan sistem saat menyetujui.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectClick = (id: string) => {
    setSelectedPayoutId(id);
    setRejectFormOpen(true);
  };

  const handleRejectSuccess = () => {
    fetchPendingPayouts();
  };

  const renderPayoutCard = (payout: PayoutRequest) => {
    const isProcessing = processingId === payout.id;

    return (
      <Card
        key={payout.id}
        className="group relative overflow-hidden border border-border/50 bg-card hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
      >
        {/* linear Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-primary via-accent to-secondary" />

        <CardContent className="p-4 space-y-3">
          {/* Header - Amount & Status */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <TbCoins className="h-5 w-5 text-primary shrink-0" />
                <h3 className="text-2xl font-bold text-primary truncate">
                  {formatCurrency(payout.amount)}
                </h3>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <TbClock className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {new Date(payout.requestedAt).toLocaleString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
            <Badge className="bg-accent/80 text-accent-foreground border-accent shrink-0 px-2.5 py-1">
              <TbSparkles className="mr-1 h-3 w-3" />
              {payout.status}
            </Badge>
          </div>

          {/* Divider */}
          <div className="h-px bg-linear-to-r from-transparent via-border to-transparent" />

          {/* User Info - Compact */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <TbUser className="h-3.5 w-3.5" />
              <span>Pengajuan dari</span>
            </div>
            <div className="pl-5">
              <p className="text-sm font-semibold text-foreground truncate">
                {payout.user.fullName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {payout.user.email}
              </p>
            </div>
          </div>

          {/* Wallet Info - Compact */}
          <div className="pl-5 pt-2 border-t border-border/50">
                <p className="text-xs font-medium text-muted-foreground mb-1">Saldo User Saat Ini:</p>
                <p className="text-lg font-bold text-green-600">
                    {formatCurrency(payout.wallet.balance)}
                </p>
            </div>

          {/* Account Info - Compact */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <TbCreditCard className="h-3.5 w-3.5" />
              <span>Rekening Tujuan</span>
            </div>
            <div className="pl-5 bg-muted/50 p-2.5 rounded-lg border border-border/30">
              <p className="font-semibold text-sm text-foreground truncate">
                {payout.account.bankName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {payout.account.accountNumber}
              </p>
              <p className="text-xs text-muted-foreground/80 truncate mt-0.5">
                a.n. {payout.account.accountName}
              </p>
            </div>
          </div>

          {/* Actions - Compact */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => handleApprove(payout.id)}
              disabled={isProcessing}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground h-9 text-sm font-semibold transition-all duration-200 hover:shadow-md"
            >
              {isProcessing ? (
                <>
                  <TbLoader className="mr-1.5 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <TbCheck className="mr-1.5 h-4 w-4" />
                  Setujui
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleRejectClick(payout.id)}
              disabled={isProcessing}
              className="px-3 h-9 border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50 transition-all duration-200"
            >
              <TbX className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>

        {/* Processing Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <TbLoader className="h-8 w-8 text-primary animate-spin" />
              <span className="text-sm font-medium text-primary">
                Memproses...
              </span>
            </div>
          </div>
        )}
      </Card>
    );
  };

  // Calculate statistics
  const totalAmount = payouts.reduce((sum, p) => sum + p.amount, 0);
  const totalRequests = payouts.length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl font-bold text-foreground font-display">
                Penarikan Dana
              </h1>
              <p className="text-sm text-muted-foreground">
                Kelola permintaan penarikan yang menunggu persetujuan
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Bar - Compact */}
        {!loading && payouts.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-primary/20 bg-linear-to-br from-primary/5 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Total Permintaan
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      {totalRequests}
                    </p>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <TbAlertCircle className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-accent/20 bg-linear-to-br from-accent/5 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Total Nominal
                    </p>
                    <p className="text-xl font-bold text-accent-foreground truncate">
                      {formatCurrency(totalAmount)}
                    </p>
                  </div>
                  <div className="p-2 bg-accent/20 rounded-lg">
                    <TbCoins className="h-6 w-6 text-accent-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <TbLoader className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground font-medium">
              Memuat data penarikan...
            </p>
          </div>
        ) : payouts.length === 0 ? (
          <Card className="border-2 border-dashed border-border/50">
            <CardContent className="py-16 text-center">
              <div className="inline-flex p-4 bg-accent/10 rounded-full mb-4">
                <TbCheck className="h-12 w-12 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2 font-display">
                Semua Bersih!
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Tidak ada permintaan penarikan dana yang tertunda saat ini. Anda
                akan melihat permintaan baru di sini.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {payouts.map(renderPayoutCard)}
          </div>
        )}
      </div>

      {/* Reject Form */}
      <RejectPayoutForm
        open={rejectFormOpen}
        onOpenChange={(open) => {
          setRejectFormOpen(open);
          if (!open) setSelectedPayoutId(null);
        }}
        payoutId={selectedPayoutId}
        onSuccess={handleRejectSuccess}
      />
    </AdminLayout>
  );
};

export default AdminPayoutsPage;
