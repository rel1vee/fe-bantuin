"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import PublicLayout from "@/components/layouts/PublicLayout";
import PaymentButton from "@/components/orders/PaymentButton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  TbFileDescription,
  TbCoin,
  TbCalendar,
  TbUser,
  TbAlertCircle,
  TbArrowLeft,
  TbCheck,
  TbMessageCircle,
  TbStar,
} from "react-icons/tb";
import { Badge } from "@/components/ui/badge";

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
    seller: {
      id: string; // Ensure ID is here
      avgRating: number;
      fullName: string;
      profilePicture: string;
      major: string;
      totalReviews: number;
    };
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
  const { openChatWith } = useChat();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isPolling) {
      intervalId = setInterval(() => {
        console.log("Polling order status...");
        fetchOrder();
      }, 2000);

      setTimeout(() => setIsPolling(false), 10000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPolling, fetchOrder]);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/auth/login");
      } else {
        fetchOrder();
      }
    }
  }, [params.id, authLoading, isAuthenticated, router, fetchOrder]);

  const handlePaymentSuccess = () => {
    setLoading(true);
    setIsPolling(true);
    fetchOrder();
  };

  const handleContactProvider = () => {
    if (!order?.service.seller) return;
    openChatWith({
      id: order.service.seller.id,
      fullName: order.service.seller.fullName,
      profilePicture: order.service.seller.profilePicture,
      major: order.service.seller.major
    });
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

  const getOrderProgress = () => {
    const statuses = [
      { key: "DRAFT", label: "Draf" },
      { key: "WAITING_PAYMENT", label: "Menunggu" },
      { key: "PAID_ESCROW", label: "Dibayar" },
      { key: "IN_PROGRESS", label: "Dalam Proses" },
      { key: "DELIVERED", label: "Diserahkan" },
      { key: "COMPLETED", label: "Selesai" },
    ];

    const currentIndex = statuses.findIndex((s) => s.key === order.status);
    return { statuses, currentIndex };
  };

  const { statuses, currentIndex } = getOrderProgress();

  return (
    <PublicLayout>
      <div className="min-h-[90vh] bg-background py-8">
        <div className="mx-auto w-full px-48">
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <TbArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </button>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-1">
                  Rincian Pesanan
                </h1>
                <p className="text-muted-foreground text-sm">
                  ID Pesanan:{" "}
                  <span className="font-mono font-medium">
                    #{order.id.substring(0, 8)}
                  </span>
                </p>
              </div>
              {getStatusBadge(order.status)}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle className="text-2xl mb-1">
                      {order.service.title}
                    </CardTitle>
                    <CardDescription className="text-base">
                      {order.service.category}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Requirements Section */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <TbFileDescription className="w-4 h-4" />
                      Kebutuhan Anda
                    </h3>
                    <div className="bg-muted/50 p-4 rounded-lg text-sm text-foreground leading-relaxed whitespace-pre-wrap border border-border">
                      {order.requirements}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                      <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1 uppercase tracking-wide">
                        <TbCalendar className="w-3.5 h-3.5" /> Tenggat
                      </p>
                      <p className="font-semibold text-foreground">
                        {new Date(order.dueDate).toLocaleDateString("id-ID", {
                          dateStyle: "long",
                        })}
                      </p>
                    </div>
                    <div className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                      <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1 uppercase tracking-wide">
                        <TbUser className="w-3.5 h-3.5" /> Pengguna Jasa
                      </p>
                      <p className="font-semibold text-foreground">
                        {order.buyer.fullName}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Tracking */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Status Pesanan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    {statuses.map((status, index) => (
                      <div
                        key={status.key}
                        className="flex flex-col items-center flex-1"
                      >
                        <div className="flex items-center gap-2 w-full mb-2">
                          {index < statuses.length - 1 && (
                            <>
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${index <= currentIndex
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                                  }`}
                              >
                                {index < currentIndex ? (
                                  <TbCheck className="w-4 h-4" />
                                ) : (
                                  index + 1
                                )}
                              </div>
                              <div
                                className={`flex-1 h-1 ${index < currentIndex
                                  ? "bg-primary"
                                  : "bg-muted"
                                  }`}
                              />
                            </>
                          )}
                          {index === statuses.length - 1 && (
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${index <= currentIndex
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                                }`}
                            >
                              {index < currentIndex ? (
                                <TbCheck className="w-4 h-4" />
                              ) : (
                                index + 1
                              )}
                            </div>
                          )}
                        </div>
                        <p
                          className={`text-xs font-medium text-center ${index <= currentIndex
                            ? "text-foreground"
                            : "text-muted-foreground"
                            }`}
                        >
                          {status.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1 space-y-6">
              {/* Payment Summary */}
              <Card className="border-2 border-primary">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TbCoin className="w-5 h-5 text-amber-500" /> Ringkasan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Biaya Jasa</span>
                      <span className="font-semibold text-foreground">
                        {formatPrice(order.price)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">
                        Biaya Platform
                      </span>
                      <span className="font-semibold text-foreground">
                        Rp 0
                      </span>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="font-bold text-primary text-xl">
                      {formatPrice(order.price)}
                    </span>
                  </div>

                  {showPayment ? (
                    <div className="space-y-3 pt-4">
                      <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs text-amber-900 flex gap-2">
                        <TbAlertCircle className="shrink-0 w-4 h-4 mt-0.5" />
                        <p>
                          Dana Anda akan disimpan dengan aman dalam rekening
                          escrow dan akan dilepaskan kepada penyedia setelah
                          penyelesaian.
                        </p>
                      </div>
                      <PaymentButton
                        orderId={order.id}
                        onSuccess={fetchOrder}
                      />
                    </div>
                  ) : (
                    <div className="pt-4">
                      <div className="bg-green-100 border border-green-700 rounded-sm p-2 text-center">
                        <p className="font-semibold text-green-900 text-sm">
                          {order.isPaid
                            ? "✓ Berhasil Dibayar"
                            : "Status: " + order.status}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Provider Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Penyedia Jasa</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      {order.service.seller ? (
                        <img
                          src={order.service.seller.profilePicture}
                          alt={order.service.seller.fullName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <TbUser className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground truncate">
                        {order.service.seller.fullName}
                      </h4>
                      {order.service.seller.avgRating >= 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <TbStar className="w-4 h-4 text-amber-500 fill-amber-500" />
                          {/* <span className="text-sm font-medium text-foreground">
                            {Number(
                              Number(order.service.seller.avgRating.toFixed(1))
                            )}
                          </span> */}
                          {order.service.seller.totalReviews >= 0 && (
                            <span className="text-xs text-muted-foreground">
                              ({order.service.seller.totalReviews} ulasan)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <Button
                    className="w-full gap-2"
                    variant="outline"
                    onClick={handleContactProvider}
                  >
                    <TbMessageCircle className="w-4 h-4" />
                    Hubungi Penyedia
                  </Button>
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
