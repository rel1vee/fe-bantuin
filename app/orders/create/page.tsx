"use client";

import { useState, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import PublicLayout from "@/components/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { TbLoader, TbAlertCircle, TbX, TbFileUpload, TbPhotoPlus, TbTrash } from "react-icons/tb";
import { uploadBuyerOrderPhoto, deleteFile } from "@/lib/upload";
import Image from "next/image";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/lib/cropImage";

const CreateOrderContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = searchParams.get("serviceId");
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [requirements, setRequirements] = useState("");
  const [attachments, setAttachments] = useState<Array<{ url: string; path: string }>>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Crop State
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [selectedFileForUpload, setSelectedFileForUpload] = useState<File | null>(null);

  if (authLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!isAuthenticated) {
    router.push("/auth/login");
    return null;
  }
  if (!serviceId) {
    router.push("/services");
    return null;
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    const file = files[0];

    // If image, open cropper
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result as string);
        setIsCropping(true);
        setSelectedFileForUpload(file);
      });
      reader.readAsDataURL(file);
      // Reset input
      e.target.value = "";
    } else {
      // Direct upload for non-images
      await processFileUpload(file);
      // Reset input
      e.target.value = "";
    }
  };

  const processFileUpload = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const orderName = `order-${Date.now()}`;
      const result = await uploadBuyerOrderPhoto(file, user!.fullName, orderName, user!.nim);

      setAttachments((prev) => [...prev, {
        url: result.data.url,
        path: result.data.path,
      }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengupload file");
    } finally {
      setUploading(false);
    }
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setUploading(true);
      const croppedBlob = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation
      );

      if (croppedBlob) {
        const file = new File([croppedBlob], selectedFileForUpload?.name || "image.jpg", { type: "image/jpeg" });
        await processFileUpload(file);
      }
      setIsCropping(false);
      setImageSrc(null);
    } catch (e) {
      console.error(e);
      setError("Gagal memproses gambar");
      setUploading(false);
    }
  };

  const handleRemoveAttachment = async (index: number) => {
    const attachment = attachments[index];
    if (!attachment) return;

    try {
      // Delete file from storage
      await deleteFile(attachment.path);
      // Remove from state
      setAttachments((prev) => prev.filter((_, i) => i !== index));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus file");
      // Still remove from UI even if delete fails (file might already be deleted)
      setAttachments((prev) => prev.filter((_, i) => i !== index));
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
          attachments: attachments.map((att) => att.url),
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
            <CardTitle className="text-2xl font-display text-primary">Detail Pesanan</CardTitle>
            <p className="text-muted-foreground">Jelaskan kebutuhan Anda kepada penyedia jasa secara detail.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="requirements">
                  Kebutuhan Pekerjaan <span className="text-destructive">*</span>
                </Label>
                <Textarea id="requirements" placeholder="Contoh: Saya butuh desain logo yang minimalis dengan warna biru..." value={requirements} onChange={(e) => setRequirements(e.target.value)} className="min-h-[150px]" required />
                <p className="text-xs text-muted-foreground">Minimal 20 karakter. Semakin detail semakin baik.</p>
              </div>

              <div className="space-y-4">
                <Label>Lampiran Pendukung (Opsional)</Label>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {/* Attachments List */}
                  {attachments.map((attachment, idx) => {
                    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(attachment.url);
                    return (
                      <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                        {isImage ? (
                          <Image src={attachment.url} alt={`Attachment ${idx + 1}`} fill className="object-cover" sizes="(max-width: 640px) 50vw, 33vw" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                            <TbFileUpload className="h-8 w-8 text-muted-foreground mb-1" />
                            <p className="text-[10px] text-muted-foreground w-full truncate px-1 break-all">{attachment.url.split('/').pop()}</p>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button type="button" size="icon" variant="destructive" onClick={() => handleRemoveAttachment(idx)} className="rounded-full h-8 w-8">
                            <TbTrash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add Button */}
                  {attachments.length < 5 && (
                    <div
                      onClick={() => !uploading && fileInputRef.current?.click()}
                      className={`
                         relative aspect-square rounded-lg border-2 border-dashed 
                         flex flex-col items-center justify-center cursor-pointer transition-all
                         ${uploading
                          ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                          : 'border-gray-300 hover:border-primary hover:bg-primary/5'
                        }
                       `}
                    >
                      {uploading ? (
                        <div className="flex flex-col items-center text-muted-foreground">
                          <TbLoader className="h-6 w-6 animate-spin mb-2" />
                          <span className="text-[10px]">Mengupload...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-muted-foreground gap-2">
                          <TbPhotoPlus className="h-8 w-8" />
                          <span className="text-xs font-medium text-center">Tambah<br />Lampiran</span>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">Upload file pendukung untuk membantu penyedia jasa memahami kebutuhan Anda</p>
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-center gap-2 text-sm">
                  <TbAlertCircle /> {error}
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={loading || requirements.length < 20}>
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
      <Dialog open={isCropping} onOpenChange={setIsCropping}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sesuaikan Gambar</DialogTitle>
            <DialogDescription>
              Sesuaikan area gambar sebelum mengupload.
            </DialogDescription>
          </DialogHeader>

          <div className="relative h-64 w-full bg-slate-900 rounded-md overflow-hidden mt-4">
            {imageSrc && (
              <Cropper
                image={imageSrc || undefined}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            )}
          </div>

          <div className="py-4 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Zoom</span>
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.1}
                onValueChange={(value) => setZoom(value[0])}
                className="flex-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rotasi</span>
              <Slider
                value={[rotation]}
                min={0}
                max={360}
                step={1}
                onValueChange={(value) => setRotation(value[0])}
                className="flex-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCropping(false)} disabled={uploading}>
              Batal
            </Button>
            <Button onClick={handleCropConfirm} disabled={uploading}>
              {uploading ? "Mengupload..." : "Simpan & Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
