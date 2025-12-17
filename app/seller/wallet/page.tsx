"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import SellerLayout from "@/components/layouts/SellerLayout";
import PayoutAccountForm from "@/components/wallet/PayoutAccountForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatNumberWithSeparator,
  parseNumberFromFormattedString,
} from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TbPlus,
  TbHistory,
  TbCreditCard,
  TbTrash,
  TbWallet,
  TbLoader,
  TbCurrencyDollar,
  TbAlertCircle,
  TbCheck,
  TbX,
  TbClock,
  TbArrowUpRight,
  TbArrowDownLeft,
  TbReceipt2,
} from "react-icons/tb";

interface WalletBalance {
  balance: number;
}

interface PayoutAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
}

interface PayoutRequest {
  id: string;
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  requestedAt: string;
  account: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
}

interface WalletTransaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

const SellerWalletPage = () => {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [accounts, setAccounts] = useState<PayoutAccount[]>([]);
  const [requests, setRequests] = useState<PayoutRequest[]>([]);
  const [history, setHistory] = useState<WalletTransaction[]>([]);

  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [payoutAmount, setPayoutAmount] = useState<number | string>("");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutError, setPayoutError] = useState("");

  // Tab state
  const [activeTab, setActiveTab] = useState("requests");

  // Filter states for Payout Requests
  const [requestsFilterMonth, setRequestsFilterMonth] = useState<string>("all");
  const [requestsFilterYear, setRequestsFilterYear] = useState<string>(
    new Date().getFullYear().toString()
  );

  // Filter states for Transaction History
  const [historyFilterMonth, setHistoryFilterMonth] = useState<string>("all");
  const [historyFilterYear, setHistoryFilterYear] = useState<string>(
    new Date().getFullYear().toString()
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const fetchWalletData = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      setLoading(true);
      const [balanceRes, accountsRes, requestsRes, historyRes] =
        await Promise.all([
          fetch("/api/wallet/balance", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/wallet/payout-accounts", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/wallet/payout-requests", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/wallet/history", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

      const balanceData = await balanceRes.json();
      const accountsData = await accountsRes.json();
      const requestsData = await requestsRes.json();
      const historyData = await historyRes.json();

      if (balanceData.success) setBalance(balanceData.data);
      if (accountsData.success) {
        setAccounts(accountsData.data);
        if (accountsData.data.length > 0) {
          setSelectedAccountId(accountsData.data[0].id);
        }
      }
      if (requestsData.success) setRequests(requestsData.data);
      if (historyData.success) setHistory(historyData.data);
    } catch (error) {
      console.error("Error fetching wallet data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/");
      } else if (!user?.isSeller) {
        router.push("/seller/activate");
      } else {
        fetchWalletData();
      }
    }
  }, [authLoading, isAuthenticated, user, router, fetchWalletData]);

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm("Yakin ingin menghapus rekening ini?")) return;

    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      const response = await fetch(`/api/wallet/payout-accounts/${accountId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.success) {
        fetchWalletData();
        alert(data.message || "Rekening berhasil dihapus.");
      } else {
        alert(data.error || data.message || "Gagal menghapus rekening.");
      }
    } catch (error) {
      alert("Terjadi kesalahan jaringan/sistem saat menghapus rekening.");
      console.error("Delete account failed:", error);
    }
  };

  const handleCreatePayoutRequest = async () => {
    setPayoutLoading(true);
    setPayoutError("");

    const amount = Number(payoutAmount);
    
    // Validasi Minimum
    if (!amount || amount < 50000) {
      setPayoutError("Minimal penarikan adalah Rp 50.000");
      setPayoutLoading(false);
      return;
    }

    // Validasi Maksimum (Backup check)
    if (amount > 10000000) {
      setPayoutError("Maksimal penarikan adalah Rp 10.000.000");
      setPayoutLoading(false);
      return;
    }

    if (!selectedAccountId) {
      setPayoutError("Mohon pilih rekening bank tujuan");
      setPayoutLoading(false);
      return;
    }

    if (balance && amount > balance.balance) {
      setPayoutError("Saldo tidak mencukupi.");
      setPayoutLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch("/api/wallet/payout-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: amount,
          payoutAccountId: selectedAccountId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message || "Permintaan penarikan berhasil dibuat");
        setPayoutAmount("");
        fetchWalletData();
      } else {
        setPayoutError(data.error || "Gagal membuat permintaan penarikan");
      }
    } catch (error) {
      setPayoutError("Terjadi kesalahan sistem");
    } finally {
      setPayoutLoading(false);
    }
  };

  const getStatusBadge = (status: PayoutRequest["status"]) => {
    const config = {
      PENDING: {
        label: "Menunggu",
        className: "bg-amber-100 text-amber-700 border border-amber-200",
      },
      APPROVED: {
        label: "Disetujui",
        className: "bg-blue-100 text-blue-700 border border-blue-200",
      },
      REJECTED: {
        label: "Ditolak",
        className: "bg-red-100 text-red-700 border border-red-200",
      },
      COMPLETED: {
        label: "Selesai",
        className: "bg-emerald-100 text-emerald-700 border border-emerald-200",
      },
    };
    const { label, className } = config[status] || config.PENDING;
    return (
      <span
        className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${className} shrink-0`}
      >
        {label}
      </span>
    );
  };

  // Filter functions
  const filterByDate = (
    dateString: string,
    filterMonth: string,
    filterYear: string
  ) => {
    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString();
    const year = date.getFullYear().toString();

    if (filterMonth === "all") {
      return year === filterYear;
    }
    return month === filterMonth && year === filterYear;
  };

  const filteredRequests = requests.filter((req) =>
    filterByDate(req.requestedAt, requestsFilterMonth, requestsFilterYear)
  );

  const filteredHistory = history.filter((tx) =>
    filterByDate(tx.createdAt, historyFilterMonth, historyFilterYear)
  );

  const months = [
    { value: "all", label: "Semua Bulan" },
    { value: "1", label: "Januari" },
    { value: "2", label: "Februari" },
    { value: "3", label: "Maret" },
    { value: "4", label: "April" },
    { value: "5", label: "Mei" },
    { value: "6", label: "Juni" },
    { value: "7", label: "Juli" },
    { value: "8", label: "Agustus" },
    { value: "9", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Desember" },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) =>
    (currentYear - i).toString()
  );

  const groupByDate = (
    items: (PayoutRequest | WalletTransaction)[],
    dateKey: 'requestedAt' | 'createdAt',
  ) => {
    const grouped = new Map<string, (PayoutRequest | WalletTransaction)[]>();
    const dateFormatter = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    
    const sortedItems = [...items].sort((a, b) => 
        new Date((b as any)[dateKey] as string).getTime() - 
        new Date((a as any)[dateKey] as string).getTime()
    );

    sortedItems.forEach((item) => {
      const dateOnly = new Date((item as any)[dateKey] as string).toDateString();
      const dateStr = dateFormatter.format(new Date(dateOnly));

      if (!grouped.has(dateStr)) {
        grouped.set(dateStr, []);
      }
      grouped.get(dateStr)!.push(item);
    });

    return Array.from(grouped.entries());
  };


  if (authLoading || loading) {
    return (
      <SellerLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout>
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
           <div className="p-2.5 bg-linear-to-br from-primary to-secondary rounded-xl shadow-lg">
              <TbWallet className="h-6 w-6 text-primary-foreground" />
            </div>
            Dompet Saya
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola saldo dan penarikan dana
          </p>
        </div>

        {/* Balance Card - Compact */}
        <Card className="border bg-gradient-to-br from-primary via-secondary to-accent text-white shadow-lg overflow-hidden relative">
          <div className="absolute inset-0 bg-grid-white/10" />
          <CardContent className="py-5 relative">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-white/80">
                  <TbWallet className="h-4 w-4" />
                  <span className="text-xs font-medium">Saldo Tersedia</span>
                </div>
                <div className="text-3xl font-bold">
                  {balance
                    ? formatCurrency(balance.balance)
                    : formatCurrency(0)}
                </div>
              </div>
              <div className="hidden md:flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm">
                <TbWallet className="h-8 w-8 text-white/60" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid - Compact */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Withdrawal Form */}
          <Card className="border shadow-sm hover:shadow-md transition-all">
            <CardHeader className="border-b bg-muted/30 py-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TbCurrencyDollar className="h-5 w-5 text-primary" />
                Tarik Dana
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="payoutAmount" className="text-sm font-medium">
                    Jumlah Penarikan
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                      Rp
                    </span>
                    <Input
                      id="payoutAmount"
                      type="text" 
                      placeholder={formatNumberWithSeparator(50000)} 
                      value={formatNumberWithSeparator(payoutAmount)}
                      onChange={(e) => {
                          const rawValue = parseNumberFromFormattedString(e.target.value);
                          let numericValue = Number(rawValue);

                          // --- MODIFIKASI: LIMIT MAKS 10.000.000 ---
                          if (numericValue > 10000000) {
                            numericValue = 10000000;
                          }
                          
                          setPayoutAmount(numericValue);
                      }}
                      className="pl-12 h-10 text-base font-semibold text-left" 
                    />
                  </div>
                  {/* UPDATE HELPER TEXT */}
                  <p className="text-xs text-muted-foreground flex justify-between">
                    <span>Min. {formatCurrency(50000)}</span>
                    <span>Maks. {formatCurrency(10000000)}</span>
                  </p>
                </div>
                <Separator />

                {/* Bank Accounts Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Rekening Tujuan
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsFormOpen(true)}
                      className="text-primary hover:text-primary/80 h-8 text-xs"
                    >
                      <TbPlus className="h-4 w-4 mr-1" /> Tambah
                    </Button>
                  </div>

                  {accounts.length === 0 ? (
                    <div className="text-center py-6 px-4 border-2 border-dashed rounded-lg bg-muted/30">
                      <TbCreditCard className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-3">
                        Belum ada rekening terdaftar
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsFormOpen(true)}
                      >
                        <TbPlus className="mr-2 h-4 w-4" /> Tambah Rekening
                      </Button>
                    </div>
                  ) : (
                    <ScrollArea className="h-[200px] pr-2">
                      <div className="space-y-2">
                        {accounts.map((acc) => (
                          <div
                            key={acc.id}
                            onClick={() => setSelectedAccountId(acc.id)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                              selectedAccountId === acc.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2 flex-1 min-w-0">
                                <TbCreditCard
                                  className={`h-5 w-5 mt-0.5 shrink-0 ${
                                    selectedAccountId === acc.id
                                      ? "text-primary"
                                      : "text-muted-foreground"
                                  }`}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm text-foreground truncate">
                                    {acc.accountName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {acc.bankName}
                                  </p>
                                  <p className="text-xs text-muted-foreground font-mono">
                                    {acc.accountNumber}
                                  </p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteAccount(acc.id);
                                }}
                                className="text-destructive hover:bg-destructive/10 h-8 w-8"
                              >
                                <TbTrash className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>

                {payoutError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-start gap-2 text-sm">
                    <TbAlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{payoutError}</span>
                  </div>
                )}

                <Button
                  onClick={handleCreatePayoutRequest}
                  className="w-full h-10 text-sm font-semibold bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                  disabled={
                    payoutLoading ||
                    accounts.length === 0 ||
                    Number(payoutAmount) < 50000 ||
                    Number(payoutAmount) > 10000000 // Disabled jika lebih (proteksi ganda)
                  }
                >
                  {payoutLoading ? (
                    <>
                      <TbLoader className="animate-spin mr-2 h-4 w-4" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <TbCurrencyDollar className="mr-2 h-5 w-5" />
                      Tarik Dana
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Tabs for Requests & History */}
          <Card className="shadow-sm hover:shadow-md transition-all border">
            <CardHeader className="border-b bg-muted/30 py-3 space-y-0">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 h-9">
                  <TabsTrigger value="requests" className="text-xs gap-1.5">
                    <TbReceipt2 className="h-4 w-4" />
                    Permintaan
                  </TabsTrigger>
                  <TabsTrigger value="history" className="text-xs gap-1.5">
                    <TbHistory className="h-4 w-4" />
                    Riwayat
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              {/* Payout Requests Tab */}
              <TabsContent value="requests" className="m-0">
                <div className="p-4 space-y-3 border-b">
                  <div className="flex items-center gap-2">
                    <Select
                      value={requestsFilterMonth}
                      onValueChange={setRequestsFilterMonth}
                    >
                      <SelectTrigger className="h-8 text-xs flex-1">
                        <SelectValue placeholder="Bulan" />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((month) => (
                          <SelectItem
                            key={month.value}
                            value={month.value}
                            className="text-xs"
                          >
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={requestsFilterYear}
                      onValueChange={setRequestsFilterYear}
                    >
                      <SelectTrigger className="h-8 text-xs w-[100px]">
                        <SelectValue placeholder="Tahun" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem
                            key={year}
                            value={year}
                            className="text-xs"
                          >
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <ScrollArea className="h-[340px]">
                  <div className="p-0">
                    {filteredRequests.length === 0 ? (
                      <div className="text-center py-8 px-4">
                        <TbReceipt2 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {requests.length === 0
                            ? "Belum ada riwayat penarikan"
                            : "Tidak ada data"}
                        </p>
                      </div>
                    ) : (
                      <div className="">
                        {groupByDate(filteredRequests, "requestedAt").map(
                          ([date, requestsOnDay], dayIdx) => (
                            <div key={date} className="mt-0">
                              {/* Date Header (Sticky) */}
                              <div className="text-sm font-semibold text-foreground px-4 py-2 bg-muted/50 top-0 z-10 border-b">
                                {date}
                              </div>

                              {requestsOnDay.map((item, reqIdx) => {
                                  const req = item as PayoutRequest;
                                return (
                                <div
                                  key={req.id}
                                  className={`p-3 hover:bg-muted/50 transition-all cursor-pointer group flex items-center justify-between ${
                                    reqIdx < requestsOnDay.length - 1 ? 'border-b border-border/50' : ''
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-3 flex-1 min-w-0">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                      <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/15 transition-colors shrink-0">
                                        <TbArrowUpRight className="h-4 w-4 text-primary" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                          <p className="font-bold text-base text-foreground truncate">
                                            {formatCurrency(req.amount)}
                                          </p>
                                          {getStatusBadge(
                                            req.status as PayoutRequest["status"]
                                          )}
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">
                                          {req.account.bankName} •{" "}
                                          {req.account.accountNumber}
                                        </p>
                                        <p className="text-xs text-muted-foreground/80 mt-0.5">
                                          {new Date(
                                            req.requestedAt
                                          ).toLocaleTimeString("id-ID", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                              })}
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Transaction History Tab */}
              <TabsContent value="history" className="m-0">
                <div className="p-4 space-y-3 border-b">
                  <div className="flex items-center gap-2">
                    <Select
                      value={historyFilterMonth}
                      onValueChange={setHistoryFilterMonth}
                    >
                      <SelectTrigger className="h-8 text-xs flex-1">
                        <SelectValue placeholder="Bulan" />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((month) => (
                          <SelectItem
                            key={month.value}
                            value={month.value}
                            className="text-xs"
                          >
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={historyFilterYear}
                      onValueChange={setHistoryFilterYear}
                    >
                      <SelectTrigger className="h-8 text-xs w-[100px]">
                        <SelectValue placeholder="Tahun" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem
                            key={year}
                            value={year}
                            className="text-xs"
                          >
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <ScrollArea className="h-[340px]">
                  <div className="p-0">
                    {filteredHistory.length === 0 ? (
                      <div className="text-center py-8 px-4">
                        <TbHistory className="h-12 w-12 text-muted-foreground/40 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {history.length === 0
                            ? "Belum ada riwayat transaksi"
                            : "Tidak ada data"}
                        </p>
                      </div>
                    ) : (
                      <div className="">
                        {groupByDate(filteredHistory, "createdAt").map(
                          ([date, historyOnDay], dayIdx) => (
                            <div key={date} className="mt-0">
                              <div className="text-sm font-semibold text-foreground px-4 py-2 bg-muted/50 top-0 z-10 border-b">
                                {date}
                              </div>

                              {historyOnDay.map((item, txIdx) => {
                                  const tx = item as WalletTransaction;
                                return (
                                <div
                                  key={tx.id}
                                  className={`p-3 hover:bg-muted/50 transition-all cursor-pointer group flex items-center justify-between ${
                                    txIdx < historyOnDay.length - 1 ? 'border-b border-border/50' : ''
                                  }`}
                                >
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div
                                      className={`p-2 rounded-lg transition-colors shrink-0 ${
                                        tx.amount > 0
                                          ? "bg-emerald-100 group-hover:bg-emerald-200"
                                          : "bg-red-100 group-hover:bg-red-200"
                                      }`}
                                    >
                                      {tx.amount > 0 ? (
                                        <TbArrowDownLeft className="h-4 w-4 text-emerald-600" />
                                      ) : (
                                        <TbArrowUpRight className="h-4 w-4 text-red-600" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-xs text-foreground truncate">
                                        {tx.description}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        {new Date(tx.createdAt).toLocaleTimeString(
                                          "id-ID",
                                          {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          }
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0 ml-2">
                                    <p
                                      className={`font-bold text-base ${
                                        tx.amount > 0
                                          ? "text-emerald-600"
                                          : "text-red-600"
                                      }`}
                                    >
                                      {tx.amount > 0 ? "+" : ""}
                                      {formatCurrency(tx.amount)}
                                    </p>
                                  </div>
                                </div>
                              );
                              })}
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>

      {/* Payout Account Form Drawer */}
      <PayoutAccountForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={fetchWalletData}
      />
    </SellerLayout>
  );
};

export default SellerWalletPage;