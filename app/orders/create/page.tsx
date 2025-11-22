"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import PublicLayout from "@/components/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { TbFileUpload, TbLoader, TbAlertCircle } from "react-icons/tb";

const CreateOrderContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = searchParams.get("serviceId");
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [requirements, setRequirements] = useState("");
  // Catatan: Untuk attachment, idealnya ada komponen upload file yang return URL
  // Disini saya buat simulasi array string URL
  const [attachments, setAttachments] = useState<string[]>([]);
  const [attachmentInput, setAttachmentInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (authLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!isAuthenticated) {
    router.push("/auth/login");
    return null;
  }
  if (!serviceId) {
    router.push("/services");
    return null;
  }

  const handleAddAttachment = () => {
    if (attachmentInput && !attachments.includes(attachmentInput)) {
      setAttachments([...attachments, attachmentInput]);
      setAttachmentInput("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("/api/orders", {
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

      const data = await res.json();

      if (data.success) {
        // Redirect ke halaman detail order untuk pembayaran
        router.push(`/orders/${data.data.id}`);
      } else {
        setError(data.error || "Gagal membuat pesanan");
      }
    } catch (err) {
      setError("Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-display text-primary">
              Detail Pesanan
            </CardTitle>
            <p className="text-muted-foreground">
              Jelaskan kebutuhan Anda kepada penyedia jasa secara detail.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="requirements">
                  Kebutuhan Pekerjaan{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="requirements"
                  placeholder="Contoh: Saya butuh desain logo yang minimalis dengan warna biru..."
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  className="min-h-[150px]"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Minimal 20 karakter. Semakin detail semakin baik.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Lampiran Pendukung (Opsional)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Masukkan URL file (Google Drive/Dropbox)"
                    value={attachmentInput}
                    onChange={(e) => setAttachmentInput(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAddAttachment}
                  >
                    <TbFileUpload className="mr-2" /> Tambah
                  </Button>
                </div>
                {attachments.length > 0 && (
                  <ul className="list-disc list-inside text-sm text-gray-600 mt-2">
                    {attachments.map((url, idx) => (
                      <li key={idx} className="truncate">
                        {url}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-center gap-2 text-sm">
                  <TbAlertCircle /> {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading || requirements.length < 20}
              >
                {loading ? (
                  <>
                    <TbLoader className="animate-spin mr-2" /> Memproses...
                  </>
                ) : (
                  "Buat Pesanan & Lanjut Pembayaran"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
};

export default function CreateOrderPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateOrderContent />
    </Suspense>
  );
}
