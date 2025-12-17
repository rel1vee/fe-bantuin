"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { TbX, TbLoader, TbPhotoPlus } from "react-icons/tb";
import { uploadServicePhoto } from "@/lib/upload";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import { SERVICE_CATEGORIES_LIST } from "@/lib/constants";

// Helper formater angka
const formatNumber = (num: number | undefined) => {
  if (!num) return "";
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

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
  pricingType?:
    | "FIXED"
    | "PER_PAGE"
    | "PER_WORD"
    | "PER_HOUR"
    | "PER_ITEM"
    | "PER_MINUTE"
    | "PER_QUESTION"
    | "PER_SLIDE"
    | "CUSTOM";
  pricePerUnit?: number;
  minimumOrder?: number;

  // Service Details
  requirements?: string;
  whatsIncluded?: string;
  additionalInfo?: string;

  // FAQ
  faq?: Array<{ question: string; answer: string }>;
}

const ServiceForm = ({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode = "create",
}: ServiceFormProps) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
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

  const handleChange = (
    field: keyof ServiceFormData,
    value: string | number | string[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // === MODIFIKASI UTAMA DI SINI ===
  const handlePriceChange = (
    field: "price" | "pricePerUnit",
    rawValue: string
  ) => {
    // 1. Hapus karakter non-angka
    const sanitizedValue = rawValue.replace(/\./g, "").replace(/[^0-9]/g, "");
    let numberValue = Number(sanitizedValue);

    // 2. LOGIKA PEMBATASAN: Maksimal 10.000.000
    if (numberValue > 10000000) {
      numberValue = 10000000; 
    }

    if (field === "pricePerUnit") {
      setFormData((prev) => ({
        ...prev,
        pricePerUnit: numberValue,
        price: numberValue, // Sinkron ke main price
      }));
    } else {
      handleChange("price", numberValue);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    if (formData.images.length + files.length > 5) {
      setErrors((prev) => ({
        ...prev,
        images: "Maksimal 5 gambar diperbolehkan",
      }));
      return;
    }

    setUploading(true);
    setErrors((prev) => ({ ...prev, images: "" }));

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const result = await uploadServicePhoto(
          file,
          user.fullName,
          formData.title || "service",
          user.nim
        );
        return result.data.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      handleChange("images", [...formData.images, ...uploadedUrls]);
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        images: err instanceof Error ? err.message : "Gagal mengupload gambar",
      }));
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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

    if (
      formData.pricingType === "FIXED" ||
      formData.pricingType === "CUSTOM"
    ) {
      if (!formData.price || formData.price <= 0) {
        newErrors.price = "Harga harus lebih dari 0";
      }
    } else {
      if (!formData.pricePerUnit || formData.pricePerUnit <= 0) {
        newErrors.price = "Harga per unit harus lebih dari 0";
      }
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
      const payload = { ...formData };

      if (!payload.minimumOrder) delete payload.minimumOrder;
      if (!payload.pricePerUnit) delete payload.pricePerUnit;

      if (
        payload.pricingType === "FIXED" ||
        payload.pricingType === "CUSTOM"
      ) {
        delete payload.pricePerUnit;
        delete payload.minimumOrder;
      } else {
        if (payload.pricePerUnit) payload.price = payload.pricePerUnit;
      }

      await onSubmit(payload);
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  const getUnitLabel = () => {
    switch (formData.pricingType) {
      case "PER_PAGE": return "Halaman";
      case "PER_WORD": return "Kata";
      case "PER_HOUR": return "Jam";
      case "PER_ITEM": return "Item";
      case "PER_MINUTE": return "Menit";
      case "PER_QUESTION": return "Soal";
      case "PER_SLIDE": return "Slide";
      default: return "Unit";
    }
  };

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>
              {mode === "create" ? "Buat Jasa Baru" : "Edit Jasa"}
            </DrawerTitle>
            <DrawerDescription>
              {mode === "create" ? (
                <>
                  Isi formulir di bawah untuk membuat jasa baru. Setelah dibuat,
                  jasa akan dikirim untuk ditinjau administrator.
                </>
              ) : (
                "Perbarui informasi jasa Anda"
              )}
            </DrawerDescription>
          </DrawerHeader>
          <form onSubmit={handleSubmit} className="px-4 overflow-y-auto">
            <div className="space-y-4 pb-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Judul Jasa <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="Contoh: Desain Logo Profesional untuk Bisnis"
                  maxLength={100}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {formData.title.length}/100 karakter
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  Deskripsi <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Jelaskan detail jasa yang Anda tawarkan..."
                  rows={5}
                  maxLength={2000}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">
                    {errors.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {formData.description.length}/2000 karakter
                </p>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">
                  Kategori <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleChange("category", value)}
                >
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
                {errors.category && (
                  <p className="text-sm text-destructive">{errors.category}</p>
                )}
              </div>

              {/* Pricing Type */}
              <div className="space-y-2">
                <Label htmlFor="pricingType">Tipe Pricing</Label>
                <Select
                  value={formData.pricingType || "FIXED"}
                  onValueChange={(value) =>
                    handleChange("pricingType", value as any)
                  }
                >
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
                    <SelectItem value="CUSTOM">
                      ⚙️ Custom (dijelaskan di deskripsi)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price - Fixed or Custom */}
              {(formData.pricingType === "FIXED" ||
                formData.pricingType === "CUSTOM") && (
                <div className="space-y-2">
                  <Label htmlFor="price">
                    {formData.pricingType === "CUSTOM"
                      ? "Kisaran Harga"
                      : "Harga Total"}{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                      Rp
                    </span>
                    <Input
                      id="price"
                      type="text"
                      value={formatNumber(formData.price)}
                      onChange={(e) => handlePriceChange("price", e.target.value)}
                      className="pl-9 pr-4"
                      placeholder="0"
                    />
                  </div>
                  {errors.price && (
                    <p className="text-sm text-destructive">{errors.price}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Maksimal Rp 10.000.000
                  </p>
                </div>
              )}

              {/* Price - Per Unit */}
              {formData.pricingType &&
                formData.pricingType !== "FIXED" &&
                formData.pricingType !== "CUSTOM" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pricePerUnit">
                        Harga Per {getUnitLabel()}{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                          Rp
                        </span>
                        
                        <Input
                          id="pricePerUnit"
                          type="text"
                          value={formatNumber(formData.pricePerUnit)}
                          onChange={(e) =>
                            handlePriceChange("pricePerUnit", e.target.value)
                          }
                          placeholder="5.000"
                          className="pl-9 pr-24"
                        />
                        
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm bg-muted/30 px-2 py-0.5 rounded">
                          / {getUnitLabel()}
                        </span>
                      </div>
                      
                      {errors.price && (
                        <p className="text-sm text-destructive">
                          {errors.price}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="minimumOrder">Minimal Order</Label>
                      <div className="relative">
                        <Input
                          id="minimumOrder"
                          type="number"
                          value={formData.minimumOrder || ""}
                          onChange={(e) =>
                            handleChange("minimumOrder", Number(e.target.value))
                          }
                          placeholder="5"
                          min={1}
                          className="pr-20"
                        />
                         <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                          {getUnitLabel()}
                        </span>
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        Min. pembelian user agar bisa checkout
                      </p>
                    </div>
                  </div>
                )}

              {/* Delivery Time */}
              <div className="space-y-2">
                <Label htmlFor="deliveryTime">
                  Waktu Pengerjaan <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="deliveryTime"
                    type="number"
                    value={formData.deliveryTime || ""}
                    onChange={(e) =>
                      handleChange("deliveryTime", Number(e.target.value))
                    }
                    placeholder="1"
                    min={1}
                    max={90}
                    className="pr-16"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    Hari
                  </span>
                </div>
                {errors.deliveryTime && (
                  <p className="text-sm text-destructive">
                    {errors.deliveryTime}
                  </p>
                )}
              </div>

              {/* Revisions */}
              <div className="space-y-2">
                <Label htmlFor="revisions">Jumlah Revisi</Label>
                <div className="relative">
                  <Input
                    id="revisions"
                    type="number"
                    value={formData.revisions || ""}
                    onChange={(e) =>
                      handleChange("revisions", Number(e.target.value))
                    }
                    placeholder="0"
                    min={0}
                    max={10}
                    className="pr-16"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    Kali
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                   Isi 0 jika tidak ada revisi
                </p>
              </div>

              {/* Service Details Section */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-sm">Informasi Tambahan</h3>

                <div className="space-y-2">
                  <Label htmlFor="requirements">
                    Yang Perlu Disiapkan Customer
                  </Label>
                  <Textarea
                    id="requirements"
                    value={formData.requirements || ""}
                    onChange={(e) =>
                      handleChange("requirements", e.target.value)
                    }
                    placeholder="Contoh: File mentah dalam format .docx, brief project, referensi desain"
                    rows={3}
                    maxLength={1000}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.requirements?.length || 0}/1000 karakter
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsIncluded">Yang Didapat Customer</Label>
                  <Textarea
                    id="whatsIncluded"
                    value={formData.whatsIncluded || ""}
                    onChange={(e) =>
                      handleChange("whatsIncluded", e.target.value)
                    }
                    placeholder="Contoh: File final PDF + source file, revisi unlimited, konsultasi gratis"
                    rows={3}
                    maxLength={1000}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.whatsIncluded?.length || 0}/1000 karakter
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalInfo">Catatan Tambahan</Label>
                  <Textarea
                    id="additionalInfo"
                    value={formData.additionalInfo || ""}
                    onChange={(e) =>
                      handleChange("additionalInfo", e.target.value)
                    }
                    placeholder="Contoh: Tidak menerima revisi di luar jam kerja, fast response"
                    rows={2}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.additionalInfo?.length || 0}/500 karakter
                  </p>
                </div>
              </div>

              {/* Images */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <Label>
                    Gambar Jasa <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {formData.images.length}/5 gambar
                  </p>
                </div>

                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={formData.images.length >= 5 || uploading}
                  className="hidden"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Existing Images */}
                  {formData.images.map((url, index) => (
                    <div
                      key={index}
                      className="relative group w-full h-32 rounded-md overflow-hidden"
                    >
                      <Image
                        src={url}
                        alt={`Preview ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1 right-1 bg-destructive text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      >
                        <TbX className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  {/* Add Image Button */}
                  {formData.images.length < 5 && (
                    <div
                      onClick={() =>
                        !uploading && fileInputRef.current?.click()
                      }
                      className={`
                        relative aspect-video rounded-lg border-2 border-dashed 
                        flex flex-col items-center justify-center cursor-pointer transition-all
                        ${
                          uploading
                            ? "border-gray-200  opacity-50 cursor-not-allowed"
                            : "border-gray-300 hover:border-primary hover:bg-primary/5"
                        }
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
                          <span className="text-xs font-medium">
                            Tambah Gambar
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {errors.images && (
                  <p className="text-sm text-destructive">{errors.images}</p>
                )}
              </div>
            </div>
          </form>

          <DrawerFooter>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full"
            >
              {loading
                ? "Menyimpan..."
                : mode === "create"
                ? "Buat Jasa"
                : "Simpan Perubahan"}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                Batal
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default ServiceForm;