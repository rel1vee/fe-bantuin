"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import PublicLayout from "@/components/layouts/PublicLayout";
import PaymentButton from "@/components/orders/PaymentButton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  TbClock,
  TbFileDescription,
  TbCoin,
  TbCalendar,
  TbUser,
  TbAlertCircle,
} from "react-icons/tb";

interface OrderDetail {
  id: string;
  status: string;
  title: string;
  price: number;
  requirements: string;
  dueDate: string;
  isPaid: boolean;
  service: {
    title: string;
    category: string;
  };
  buyer: {
    id: string;
    fullName: string;
  };
}

const OrderDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // State untuk mengatur polling
  const [isPolling, setIsPolling] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`/api/orders/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setOrder(data.data);

        // Jika kita sedang polling DAN status sudah berubah jadi PAID/COMPLETED, hentikan polling
        if (
          isPolling &&
          (data.data.status === "PAID_ESCROW" ||
            data.data.status === "IN_PROGRESS")
        ) {
          setIsPolling(false);
        }
      }
    } catch (error) {
      console.error("Error fetching order:", error);
    } finally {
      setLoading(false);
    }
  }, [params.id, isPolling]);

  // Effect untuk polling setiap 2 detik jika isPolling true
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isPolling) {
      intervalId = setInterval(() => {
        console.log("Polling order status...");
        fetchOrder();
      }, 2000); // Cek setiap 2 detik

      // Stop polling otomatis setelah 10 detik jika status tidak berubah (timeout)
      setTimeout(() => setIsPolling(false), 10000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPolling, fetchOrder]);

  // Load awal
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/auth/login");
      } else {
        fetchOrder();
      }
    }
  }, [params.id, authLoading, isAuthenticated, router, fetchOrder]);

  // Handler ketika pembayaran sukses di komponen PaymentButton
  const handlePaymentSuccess = () => {
    setLoading(true); // Tampilkan loading sebentar
    setIsPolling(true); // Mulai cek status berulang-ulang
    fetchOrder(); // Cek manual sekali
  };

  if (loading || authLoading) {
    return (
      <PublicLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </PublicLayout>
    );
  }

  if (!order) {
    return (
      <PublicLayout>
        <div className="container mx-auto py-12 text-center">
          <p className="text-xl">Pesanan tidak ditemukan</p>
        </div>
      </PublicLayout>
    );
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      DRAFT: "bg-gray-200 text-gray-700",
      WAITING_PAYMENT: "bg-yellow-100 text-yellow-700 border-yellow-200",
      PAID_ESCROW: "bg-blue-100 text-blue-700 border-blue-200",
      IN_PROGRESS: "bg-purple-100 text-purple-700 border-purple-200",
      DELIVERED: "bg-orange-100 text-orange-700 border-orange-200",
      COMPLETED: "bg-green-100 text-green-700 border-green-200",
      CANCELLED: "bg-red-100 text-red-700 border-red-200",
    };
    return (
      <Badge
        variant="outline"
        className={`${styles[status] || "bg-gray-100"} px-3 py-1`}
      >
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const showPayment =
    order.status === "DRAFT" || order.status === "WAITING_PAYMENT";

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Detail Pesanan
            </h1>
            <p className="text-gray-600">ID: #{order.id.substring(0, 8)}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Kolom Kiri: Detail Order */}
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl mb-1">
                        {order.service.title}
                      </CardTitle>
                      <CardDescription>
                        {order.service.category}
                      </CardDescription>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                      <TbFileDescription /> Requirements Anda
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {order.requirements}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <TbCalendar /> Deadline
                      </p>
                      <p className="font-medium text-sm">
                        {new Date(order.dueDate).toLocaleDateString("id-ID", {
                          dateStyle: "long",
                        })}
                      </p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <TbUser /> Pemesan
                      </p>
                      <p className="font-medium text-sm">
                        {order.buyer.fullName}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tampilkan jika status IN_PROGRESS atau DELIVERED (bisa ditambahkan nanti) */}
              {order.status === "PAID_ESCROW" && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 flex gap-3">
                  <TbClock className="text-blue-600 text-xl shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-800">
                      Menunggu Penyedia
                    </h4>
                    <p className="text-sm text-blue-700">
                      Pembayaran berhasil diamankan. Penyedia jasa akan segera
                      memulai pekerjaan.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Kolom Kanan: Pembayaran */}
            <div className="md:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TbCoin className="text-yellow-600" /> Ringkasan Biaya
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Harga Jasa</span>
                    <span className="font-medium">
                      {formatPrice(order.price)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Biaya Layanan</span>
                    <span className="font-medium">Rp 0</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="font-bold text-primary text-lg">
                      {formatPrice(order.price)}
                    </span>
                  </div>

                  {showPayment ? (
                    <div className="space-y-3 pt-4">
                      <div className="bg-yellow-50 p-3 rounded text-xs text-yellow-800 flex gap-2">
                        <TbAlertCircle className="shrink-0 text-base" />
                        <p>
                          Dana Anda akan ditahan di Escrow (Rekening Bersama)
                          dan baru diteruskan ke penyedia setelah pekerjaan
                          selesai.
                        </p>
                      </div>
                      <PaymentButton
                        orderId={order.id}
                        onSuccess={fetchOrder}
                      />
                    </div>
                  ) : (
                    <div className="pt-4 text-center">
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-700 w-full justify-center py-2"
                      >
                        {order.isPaid
                          ? "Lunas"
                          : "Status Pembayaran: " + order.status}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default OrderDetailPage;
