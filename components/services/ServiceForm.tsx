"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { TbX, TbLoader } from "react-icons/tb";
import { uploadServicePhoto } from "@/lib/upload";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";

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
  images: string[];
}

const categories = [
  { value: "DESIGN", label: "Desain" },
  { value: "DATA", label: "Data" },
  { value: "CODING", label: "Pemrograman" },
  { value: "WRITING", label: "Penulisan" },
  { value: "EVENT", label: "Acara" },
  { value: "TUTOR", label: "Tutor" },
  { value: "TECHNICAL", label: "Teknis" },
  { value: "OTHER", label: "Lainnya" },
];

const ServiceForm = ({ open, onOpenChange, onSubmit, initialData, mode = "create" }: ServiceFormProps) => {
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
    revisions: initialData?.revisions || 1,
    images: initialData?.images || [],
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

    if (formData.images.length + files.length > 5) {
      setErrors((prev) => ({
        ...prev,
        images: "Maksimal 5 gambar",
      }));
      return;
    }

    setUploading(true);
    setErrors((prev) => ({ ...prev, images: "" }));

    try {
      const uploadPromises = Array.from(files).map((file) => uploadServicePhoto(file, user.fullName, formData.title || "service", user.nim));

      const results = await Promise.all(uploadPromises);
      const newUrls = results.map((result) => result.data.url);
      handleChange("images", [...formData.images, ...newUrls]);
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
        revisions: 1,
        images: [],
      });
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>{mode === "create" ? "Buat Jasa Baru" : "Edit Jasa"}</DrawerTitle>
          <DrawerDescription>{mode === "create" ? "Isi formulir di bawah untuk membuat jasa baru" : "Perbarui informasi jasa Anda"}</DrawerDescription>
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
                  {categories.map((cat) => (
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

            {/* Delivery Time & Revisions */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryTime">
                  Waktu Pengerjaan (hari) <span className="text-destructive">*</span>
                </Label>
                <Input id="deliveryTime" type="number" value={formData.deliveryTime || ""} onChange={(e) => handleChange("deliveryTime", Number(e.target.value))} placeholder="7" min={1} max={90} />
                {errors.deliveryTime && <p className="text-sm text-destructive">{errors.deliveryTime}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="revisions">Jumlah Revisi</Label>
                <Input id="revisions" type="number" value={formData.revisions || ""} onChange={(e) => handleChange("revisions", Number(e.target.value))} placeholder="1" min={0} max={10} />
              </div>
            </div>

            {/* Images */}
            <div className="space-y-2">
              <Label>
                Gambar Jasa <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileSelect} disabled={formData.images.length >= 5 || uploading} className="flex-1" />
                {uploading && (
                  <div className="flex items-center text-sm text-muted-foreground px-2">
                    <TbLoader className="animate-spin mr-2" />
                    Mengupload...
                  </div>
                )}
              </div>
              {errors.images && <p className="text-sm text-destructive">{errors.images}</p>}
              <p className="text-xs text-muted-foreground">{formData.images.length}/5 gambar</p>

              {/* Image Preview */}
              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {formData.images.map((url, index) => (
                    <div key={index} className="relative group w-full h-32 rounded-md overflow-hidden">
                      <Image src={url} alt={`Preview ${index + 1}`} fill className="object-cover" sizes="(max-width: 768px) 50vw, 33vw" />
                      <button type="button" onClick={() => handleRemoveImage(index)} className="absolute top-1 right-1 bg-destructive text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <TbX className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
  );
};

export default ServiceForm;
