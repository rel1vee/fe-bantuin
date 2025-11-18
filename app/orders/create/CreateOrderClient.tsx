"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  TbClock,
  TbRefresh,
  TbX,
  TbArrowLeft,
  TbFileUpload,
} from "react-icons/tb";
import { Separator } from "@/components/ui/separator";

// Tipe data untuk service (bisa disesuaikan)
interface ServiceDetail {
  id: string;
  title: string;
  price: number;
  deliveryTime: number;
  revisions: number;
  images: string[];
  seller: {
    fullName: string;
    profilePicture: string | null;
  };
}

const CreateOrderClient = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [service, setService] = useState<ServiceDetail | null>(null);
  const [requirements, setRequirements] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [tempUrl, setTempUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const serviceId = searchParams.get("serviceId");

  // 1. Proteksi Halaman
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/"); // Redirect jika belum login
    }
  }, [authLoading, isAuthenticated, router]);

  // 2. Fetch detail service untuk ditampilkan
  useEffect(() => {
    if (serviceId) {
      const fetchService = async () => {
        try {
          const response = await fetch(`/api/services/${serviceId}`);
          const data = await response.json();
          if (data.success) {
            setService(data.data);
          } else {
            setError("Gagal memuat detail jasa.");
          }
        } catch (err) {
          setError("Terjadi kesalahan jaringan.");
        }
      };
      fetchService();
    }
  }, [serviceId]);

  const handleAddAttachment = () => {
    if (tempUrl && attachments.length < 10) {
      // TODO: Validasi URL sederhana
      setAttachments([...attachments, tempUrl]);
      setTempUrl("");
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  // 3. Handle Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (requirements.length < 20) {
      setError("Deskripsi kebutuhan minimal 20 karakter.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          serviceId,
          requirements,
          attachments,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // SUKSES! Arahkan ke halaman konfirmasi
        router.push(`/orders/confirm?orderId=${data.data.id}`);
      } else {
        setError(data.message || "Gagal membuat pesanan.");
      }
    } catch (err) {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (!serviceId) {
    return <div>Service ID tidak ditemukan.</div>;
  }

  if (!service) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Kolom Kiri: Form */}
      <div className="lg:col-span-2">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <TbArrowLeft className="mr-2" />
          Kembali
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Buat Pesanan</CardTitle>
            <CardDescription>
              Jelaskan kebutuhan Anda agar penyedia jasa dapat memahaminya.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {/* Requirements */}
              <div className="space-y-2">
                <Label htmlFor="requirements">
                  Deskripsi Kebutuhan{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="requirements"
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="Contoh: Saya butuh logo untuk usaha kopi. Nama brand: Kopi Senja. Konsep minimalis dan modern..."
                  rows={8}
                  maxLength={2000}
                />
                <p className="text-xs text-muted-foreground">
                  {requirements.length}/2000 karakter (min. 20)
                </p>
              </div>

              {/* Attachments */}
              <div className="space-y-2">
                <Label htmlFor="attachments">Lampiran (Opsional)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Tambahkan file pendukung seperti referensi, brief, atau aset.
                  (Maks. 10 file, berupa URL).
                </p>
                <div className="flex gap-2">
                  <Input
                    id="attachments"
                    value={tempUrl}
                    onChange={(e) => setTempUrl(e.target.value)}
                    placeholder="https://link-ke-file-anda.com/gambar.jpg"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddAttachment}
                    disabled={!tempUrl || attachments.length >= 10}
                  >
                    <TbFileUpload className="mr-2" />
                    Tambah
                  </Button>
                </div>
                <div className="space-y-2 mt-2">
                  {attachments.map((url, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm p-2 bg-gray-100 rounded"
                    >
                      <span className="truncate w-full pr-4">{url}</span>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => handleRemoveAttachment(index)}
                      >
                        <TbX />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </CardContent>
            <CardFooter>
              <Button type="submit" size="lg" disabled={loading}>
                {loading ? "Menyimpan..." : "Simpan & Lanjutkan ke Konfirmasi"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      {/* Kolom Kanan: Ringkasan Jasa */}
      <div className="lg:col-span-1">
        <div className="sticky top-24 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Jasa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <Image
                  src={service.images[0] || "/placeholder-image.png"}
                  alt={service.title}
                  width={80}
                  height={60}
                  className="rounded-lg object-cover"
                />
                <h3 className="font-semibold leading-snug">{service.title}</h3>
              </div>
              <Separator className="my-4" />
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={service.seller.profilePicture || ""} />
                  <AvatarFallback>
                    {getInitials(service.seller.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {service.seller.fullName}
                  </p>
                  <p className="text-xs text-muted-foreground">Penyedia Jasa</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TbClock className="h-4 w-4" />
                    <span>Waktu Pengerjaan</span>
                  </div>
                  <span className="font-medium">
                    {service.deliveryTime} hari
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TbRefresh className="h-4 w-4" />
                    <span>Revisi</span>
                  </div>
                  <span className="font-medium">{service.revisions}x</span>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="flex items-center justify-between">
                <span className="text-base font-medium">Total Harga</span>
                <span className="text-xl font-bold text-primary">
                  Rp {Number(service.price).toLocaleString("id-ID")}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateOrderClient;
