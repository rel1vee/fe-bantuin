"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { TbArrowLeft, TbLock } from "react-icons/tb";
import { Label } from "@/components/ui/label";

// Tipe data untuk Order (bisa disesuaikan)
interface OrderDetail {
  id: string;
  title: string;
  price: number;
  requirements: string;
  attachments: string[];
  status: string;
}

const ConfirmOrderClient = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const orderId = searchParams.get("orderId");
  const MIDTRANS_CLIENT_KEY = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY!;

  // 1. Fetch detail order yang berstatus DRAFT
  useEffect(() => {
    if (orderId && !authLoading && isAuthenticated) {
      const fetchOrder = async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem("access_token");
          const response = await fetch(`/api/orders/${orderId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await response.json();

          if (data.success) {
            if (data.data.status !== "DRAFT") {
              setError("Pesanan ini tidak valid atau sudah diproses.");
            } else {
              setOrder(data.data);
            }
          } else {
            setError(data.message || "Gagal memuat detail pesanan.");
          }
        } catch (err) {
          setError("Terjadi kesalahan jaringan.");
        } finally {
          setLoading(false);
        }
      };
      fetchOrder();
    }
  }, [orderId, authLoading, isAuthenticated]);

  // 2. Handle Konfirmasi dan Pembayaran
  const handleConfirmAndPay = async () => {
    if (!order) return;

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`/api/orders/${order.id}/confirm`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.success && data.paymentToken) {
        // Pembayaran Midtrans
        (window as any).snap.pay(data.paymentToken, {
          onSuccess: (result: any) => {
            console.log("Payment Success:", result);
            // Arahkan ke halaman daftar pesanan buyer
            router.push(`/buyer/orders/${order.id}`);
          },
          onPending: (result: any) => {
            console.log("Payment Pending:", result);
            router.push(`/buyer/orders/${order.id}`);
          },
          onError: (error: any) => {
            console.error("Payment Error:", error);
            setError("Gagal memproses pembayaran. Silakan coba lagi.");
          },
          onClose: () => {
            console.log("Popup pembayaran ditutup");
          },
        });
      } else {
        setError(data.message || "Gagal mendapatkan token pembayaran.");
      }
    } catch (err) {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle>Terjadi Kesalahan</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mt-4"
          >
            <TbArrowLeft className="mr-2" />
            Kembali
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!order) {
    return null; // Atau state loading
  }

  return (
    <>
      {/* Load Script Midtrans */}
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={MIDTRANS_CLIENT_KEY}
        strategy="afterInteractive"
      />

      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <TbArrowLeft className="mr-2" />
        Kembali
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Konfirmasi Pesanan</CardTitle>
          <CardDescription>
            Satu langkah lagi. Periksa kembali pesanan Anda sebelum melakukan
            pembayaran.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Jasa</Label>
            <p className="font-medium">{order.title}</p>
          </div>
          <div>
            <Label>Kebutuhan Anda</Label>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap p-3 bg-gray-50 rounded-md">
              {order.requirements}
            </p>
          </div>
          {order.attachments.length > 0 && (
            <div>
              <Label>Lampiran</Label>
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                {order.attachments.map((file, i) => (
                  <li key={i} className="truncate">
                    {file}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-4">
          <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
            <span className="text-base font-medium">Total Pembayaran</span>
            <span className="text-2xl font-bold text-primary">
              Rp {Number(order.price).toLocaleString("id-ID")}
            </span>
          </div>
          <Button
            size="lg"
            className="w-full"
            onClick={handleConfirmAndPay}
            disabled={loading}
          >
            <TbLock className="mr-2" />
            {loading ? "Memproses..." : "Konfirmasi & Bayar"}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Pembayaran aman diproses oleh Midtrans.
          </p>
        </CardFooter>
      </Card>
    </>
  );
};

export default ConfirmOrderClient;
