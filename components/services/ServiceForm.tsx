"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { TbX, TbLoader, TbPhotoPlus } from "react-icons/tb";
import { uploadServicePhoto } from "@/lib/upload";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/lib/cropImage";
import { SERVICE_CATEGORIES_LIST } from "@/lib/constants";

interface ServiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ServiceFormData) => Promise<void>;
  initialData?: Partial<ServiceFormData>;
  mode?: "create" | "edit";
}

export interface ServiceFormData {
  title: string;
  description: string;
  category: string;
  price: number;
  deliveryTime: number;
  revisions: number;
  allowRevisions?: boolean;
  images: string[];

  // Pricing Details
  pricingType?: "FIXED" | "PER_PAGE" | "PER_WORD" | "PER_HOUR" | "PER_ITEM" | "PER_MINUTE" | "PER_QUESTION" | "PER_SLIDE" | "CUSTOM";
  pricePerUnit?: number;
  minimumOrder?: number;

  // Service Details
  requirements?: string;
  whatsIncluded?: string;
  additionalInfo?: string;

  // FAQ
  faq?: Array<{ question: string; answer: string }>;
}

const ServiceForm = ({ open, onOpenChange, onSubmit, initialData, mode = "create" }: ServiceFormProps) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [formData, setFormData] = useState<ServiceFormData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    category: initialData?.category || "",
    price: initialData?.price || 0,
    deliveryTime: initialData?.deliveryTime || 1,
    revisions: initialData?.revisions || 0,
    allowRevisions: (initialData?.revisions || 0) > 0,
    images: initialData?.images || [],

    // New fields
    pricingType: initialData?.pricingType || "FIXED",
    pricePerUnit: initialData?.pricePerUnit,
    minimumOrder: initialData?.minimumOrder,
    requirements: initialData?.requirements || "",
    whatsIncluded: initialData?.whatsIncluded || "",
    additionalInfo: initialData?.additionalInfo || "",
    faq: initialData?.faq || [],
  });

  const handleChange = (field: keyof ServiceFormData, value: string | number | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    // Check limit
    if (formData.images.length + 1 > 5) {
      setErrors((prev) => ({
        ...prev,
        images: "Maksimal 5 gambar",
      }));
      return;
    }

    // Read the first selected file for cropping
    const file = files[0];
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setImageSrc(reader.result as string);
      setIsCropping(true);
    });
    reader.readAsDataURL(file);

    // Reset input to allow selecting same file again
    e.target.value = "";
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const uploadCroppedImage = async (blob: Blob) => {
    if (!user) return;

    setUploading(true);
    setErrors((prev) => ({ ...prev, images: "" }));
    setIsCropping(false);

    try {
      // Convert blob to File
      const file = new File([blob], `service-${Date.now()}.jpg`, { type: "image/jpeg" });

      const result = await uploadServicePhoto(file, user.fullName, formData.title || "service", user.nim);
      const newUrl = result.data.url;
      handleChange("images", [...formData.images, newUrl]);
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        images: err instanceof Error ? err.message : "Gagal mengupload gambar",
      }));
    } finally {
      setUploading(false);
      setImageSrc(null);
    }
  };

  const handleCropConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setUploading(true);
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);

      if (croppedImage) {
        await uploadCroppedImage(croppedImage);
      }
    } catch (e) {
      console.error(e);
      setErrors((prev) => ({ ...prev, images: "Gagal memproses gambar" }));
      setUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    handleChange(
      "images",
      formData.images.filter((_, i) => i !== index)
    );
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title || formData.title.length < 10) {
      newErrors.title = "Judul minimal 10 karakter";
    }
    if (!formData.description || formData.description.length < 50) {
      newErrors.description = "Deskripsi minimal 50 karakter";
    }
    if (!formData.category) {
      newErrors.category = "Kategori wajib dipilih";
    }
    if (!formData.price || formData.price <= 0) {
      newErrors.price = "Harga harus lebih dari 0";
    }
    if (!formData.deliveryTime || formData.deliveryTime <= 0) {
      newErrors.deliveryTime = "Waktu pengerjaan harus lebih dari 0";
    }
    if (formData.images.length === 0) {
      newErrors.images = "Minimal 1 gambar diperlukan";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
      // Reset form
      setFormData({
        title: "",
        description: "",
        category: "",
        price: 0,
        deliveryTime: 1,
        revisions: 0,
        allowRevisions: false,
        images: [],
        pricingType: undefined,
        pricePerUnit: undefined,
        minimumOrder: undefined,
        requirements: "",
        whatsIncluded: "",
        additionalInfo: "",
        faq: [],
      });
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>{mode === "create" ? "Buat Jasa Baru" : "Edit Jasa"}</DrawerTitle>
            <DrawerDescription>
              {mode === "create" ? <>Isi formulir di bawah untuk membuat jasa baru. Setelah dibuat, jasa akan dikirim untuk ditinjau administrator sebelum dipublikasikan.</> : "Perbarui informasi jasa Anda"}
            </DrawerDescription>
          </DrawerHeader>
          <form onSubmit={handleSubmit} className="px-4 overflow-y-auto">
            <div className="space-y-4 pb-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Judul Jasa <span className="text-destructive">*</span>
                </Label>
                <Input id="title" value={formData.title} onChange={(e) => handleChange("title", e.target.value)} placeholder="Contoh: Desain Logo Profesional untuk Bisnis" maxLength={100} />
                {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
                <p className="text-xs text-muted-foreground">{formData.title.length}/100 karakter</p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  Deskripsi <span className="text-destructive">*</span>
                </Label>
                <Textarea id="description" value={formData.description} onChange={(e) => handleChange("description", e.target.value)} placeholder="Jelaskan detail jasa yang Anda tawarkan..." rows={5} maxLength={2000} />
                {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                <p className="text-xs text-muted-foreground">{formData.description.length}/2000 karakter</p>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">
                  Kategori <span className="text-destructive">*</span>
                </Label>
                <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_CATEGORIES_LIST.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
              </div>

              {/* Price */}
              <div className="space-y-2">
                <Label htmlFor="price">
                  Harga (Rp) <span className="text-destructive">*</span>
                </Label>
                <Input id="price" type="number" value={formData.price || ""} onChange={(e) => handleChange("price", Number(e.target.value))} placeholder="50000" min={0} max={10000000} />
                {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
                <p className="text-xs text-muted-foreground">Maksimal Rp 10.000.000</p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="deliveryTime">
                  Waktu Pengerjaan (hari) <span className="text-destructive">*</span>
                </Label>
                <Input id="deliveryTime" type="number" value={formData.deliveryTime || ""} onChange={(e) => handleChange("deliveryTime", Number(e.target.value))} placeholder="7" min={1} max={90} />
                {errors.deliveryTime && <p className="text-sm text-destructive">{errors.deliveryTime}</p>}
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="revisions">Jumlah Revisi</Label>
                <Input id="revisions" type="number" value={formData.revisions || ""} onChange={(e) => handleChange("revisions", Number(e.target.value))} placeholder="1" min={0} max={10} />
              </div>

              {/* Pricing Details Section */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-sm">Detail Harga</h3>

                <div className="space-y-2">
                  <Label htmlFor="pricingType">Tipe Pricing</Label>
                  <Select value={formData.pricingType || "FIXED"} onValueChange={(value) => handleChange("pricingType", value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Tipe Pricing" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIXED">💰 Harga Tetap</SelectItem>
                      <SelectItem value="PER_PAGE">📄 Per Halaman</SelectItem>
                      <SelectItem value="PER_WORD">📝 Per Kata</SelectItem>
                      <SelectItem value="PER_HOUR">⏰ Per Jam</SelectItem>
                      <SelectItem value="PER_ITEM">🖼️ Per Item</SelectItem>
                      <SelectItem value="PER_MINUTE">⏱️ Per Menit</SelectItem>
                      <SelectItem value="PER_QUESTION">❓ Per Soal</SelectItem>
                      <SelectItem value="PER_SLIDE">🎞️ Per Slide</SelectItem>
                      <SelectItem value="CUSTOM">⚙️ Custom (dijelaskan di deskripsi)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Pilih model pricing yang sesuai dengan jasa Anda</p>
                </div>

                {(formData.pricingType === "FIXED" || formData.pricingType === "CUSTOM") && (
                  <div className="space-y-2">
                    <Label htmlFor="price">
                      {formData.pricingType === "CUSTOM" ? "Kisaran Harga (Rp)" : "Harga (Rp)"} <span className="text-destructive">*</span>
                    </Label>
                    <Input id="price" type="number" value={formData.price || ""} onChange={(e) => handleChange("price", Number(e.target.value))} placeholder="50000" min={0} max={10000000} />
                    {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
                    <p className="text-xs text-muted-foreground">Maksimal Rp 10.000.000</p>
                  </div>
                )}

                {formData.pricingType && formData.pricingType !== "FIXED" && formData.pricingType !== "CUSTOM" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="pricePerUnit">
                          Harga Per{" "}
                          {formData.pricingType === "PER_PAGE"
                            ? "Halaman"
                            : formData.pricingType === "PER_WORD"
                            ? "Kata"
                            : formData.pricingType === "PER_HOUR"
                            ? "Jam"
                            : formData.pricingType === "PER_ITEM"
                            ? "Item"
                            : formData.pricingType === "PER_MINUTE"
                            ? "Menit"
                            : formData.pricingType === "PER_QUESTION"
                            ? "Soal"
                            : formData.pricingType === "PER_SLIDE"
                            ? "Slide"
                            : "Unit"}
                        </Label>
                        <Input
                          id="pricePerUnit"
                          type="number"
                          value={formData.pricePerUnit || ""}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setFormData((prev) => ({ ...prev, pricePerUnit: val, price: val }));
                            if (errors.price) setErrors((prev) => ({ ...prev, price: "" }));
                          }}
                          placeholder="5000"
                          min={0}
                        />
                        {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="minimumOrder">Minimal Order</Label>
                        <Input id="minimumOrder" type="number" value={formData.minimumOrder || ""} onChange={(e) => handleChange("minimumOrder", Number(e.target.value))} placeholder="5" min={1} />
                        <p className="text-xs text-muted-foreground">
                          Misal: minimal 5{" "}
                          {formData.pricingType === "PER_PAGE"
                            ? "halaman"
                            : formData.pricingType === "PER_WORD"
                            ? "kata"
                            : formData.pricingType === "PER_HOUR"
                            ? "jam"
                            : formData.pricingType === "PER_ITEM"
                            ? "item"
                            : formData.pricingType === "PER_MINUTE"
                            ? "menit"
                            : formData.pricingType === "PER_QUESTION"
                            ? "soal"
                            : formData.pricingType === "PER_SLIDE"
                            ? "slide"
                            : "unit"}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Service Details Section */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-sm">Informasi Tambahan</h3>

                <div className="space-y-2">
                  <Label htmlFor="requirements">Yang Perlu Disiapkan Customer</Label>
                  <Textarea
                    id="requirements"
                    value={formData.requirements || ""}
                    onChange={(e) => handleChange("requirements", e.target.value)}
                    placeholder="Contoh: File mentah dalam format .docx, brief project, referensi desain"
                    rows={3}
                    maxLength={1000}
                  />
                  <p className="text-xs text-muted-foreground">{formData.requirements?.length || 0}/1000 karakter</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsIncluded">Yang Didapat Customer</Label>
                  <Textarea
                    id="whatsIncluded"
                    value={formData.whatsIncluded || ""}
                    onChange={(e) => handleChange("whatsIncluded", e.target.value)}
                    placeholder="Contoh: File final PDF + source file, revisi unlimited, konsultasi gratis"
                    rows={3}
                    maxLength={1000}
                  />
                  <p className="text-xs text-muted-foreground">{formData.whatsIncluded?.length || 0}/1000 karakter</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalInfo">Catatan Tambahan</Label>
                  <Textarea
                    id="additionalInfo"
                    value={formData.additionalInfo || ""}
                    onChange={(e) => handleChange("additionalInfo", e.target.value)}
                    placeholder="Contoh: Tidak menerima revisi di luar jam kerja, fast response"
                    rows={2}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground">{formData.additionalInfo?.length || 0}/500 karakter</p>
                </div>
              </div>

              {/* Images */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>
                    Gambar Jasa <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-xs text-muted-foreground">{formData.images.length}/5 gambar</p>
                </div>

                <Input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} disabled={formData.images.length >= 5 || uploading} className="hidden" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Existing Images */}
                  {formData.images.map((url, index) => (
                    <div key={index} className="relative group w-full h-32 rounded-md overflow-hidden">
                      <Image src={url} alt={`Preview ${index + 1}`} fill className="object-cover" sizes="(max-width: 768px) 50vw, 33vw" />
                      <button type="button" onClick={() => handleRemoveImage(index)} className="absolute top-1 right-1 bg-destructive text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <TbX className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  {/* Add Image Button */}
                  {formData.images.length < 5 && (
                    <div
                      onClick={() => !uploading && fileInputRef.current?.click()}
                      className={`
                      relative aspect-[16/9] rounded-lg border-2 border-dashed 
                      flex flex-col items-center justify-center cursor-pointer transition-all
                      ${uploading ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed" : "border-gray-300 hover:border-primary hover:bg-primary/5"}
                    `}
                    >
                      {uploading ? (
                        <div className="flex flex-col items-center text-muted-foreground">
                          <TbLoader className="h-8 w-8 animate-spin mb-2" />
                          <span className="text-xs">Mengupload...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-muted-foreground gap-2">
                          <TbPhotoPlus className="h-8 w-8" />
                          <span className="text-xs font-medium">Tambah Gambar</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {errors.images && <p className="text-sm text-destructive">{errors.images}</p>}
              </div>
            </div>
          </form>

          <DrawerFooter>
            <Button onClick={handleSubmit} disabled={loading} className="w-full">
              {loading ? "Menyimpan..." : mode === "create" ? "Buat Jasa" : "Simpan Perubahan"}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                Batal
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Dialog open={isCropping} onOpenChange={setIsCropping}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sesuaikan Gambar Jasa</DialogTitle>
            <DialogDescription>Sesuaikan area gambar yang akan ditampilkan. Rasio gambar 16:9.</DialogDescription>
          </DialogHeader>

          <div className="relative h-64 w-full bg-slate-900 rounded-md overflow-hidden mt-4">
            {imageSrc && <Cropper image={imageSrc || undefined} crop={crop} zoom={zoom} rotation={rotation} aspect={16 / 9} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />}
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsCropping(false)}>
              Batal
            </Button>
            <Button onClick={handleCropConfirm} disabled={uploading}>
              {uploading ? "Menyimpan..." : "Simpan Gambar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ServiceForm;
