"use client";

import { useState, useRef } from "react";
import BuyerLayout from "@/components/layouts/BuyerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { uploadAccountPhoto } from "@/lib/upload";
import { TbLoader, TbUpload, TbAlertCircle } from "react-icons/tb";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/lib/cropImage";
import Image from "next/image";

export default function BuyerSettingsPage() {
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [previewImage, setPreviewImage] = useState("");

  // Crop State
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);


  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result as string);
        setIsCropping(true);
      });
      reader.readAsDataURL(file);
      // Reset input value to allow selecting same file again if needed
      e.target.value = "";
    }
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const uploadCroppedImage = async (blob: Blob) => {
    if (!user) return;

    setUploading(true);
    setError("");
    setSuccess("");
    setIsCropping(false); // Close cropper

    try {
      // Create a File object from the Blob
      const file = new File([blob], "profile-cropped.jpg", { type: "image/jpeg" });

      const result = await uploadAccountPhoto(
        file,
        user.fullName,
        user.nim
      );

      // Update profile picture via API
      const token = localStorage.getItem("access_token");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5500/api";
      const response = await fetch(`${API_URL}/users/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          profilePicture: result.data.url,
        }),
      });

      if (response.ok) {
        setSuccess("Foto profil berhasil diupdate");
        setPreviewImage(`${result.data.url}?t=${new Date().getTime()}`);
        await refreshUser();
      } else {
        throw new Error("Gagal mengupdate foto profil");
      }
    } catch (err: any) {
      setError(err.message || "Gagal mengupload foto");
    } finally {
      setUploading(false);
      setImageSrc(null); // Reset crop image
    }
  };

  const handleCropConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setUploading(true);
      const croppedImage = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation
      );

      if (croppedImage) {
        await uploadCroppedImage(croppedImage);
      }
    } catch (e) {
      console.error(e);
      setError("Gagal memproses gambar");
      setUploading(false);
    }
  };

  return (

    <>
      <BuyerLayout>
        <h1 className="text-2xl font-bold mb-6">Pengaturan Akun</h1>
        <Card>
          <CardHeader>
            <CardTitle>Profil Saya</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage
                    src={
                      previewImage ||
                      (user?.profilePicture
                        ? `${user?.profilePicture}?t=${new Date().getTime()}` // Append timestamp to bust cache
                        : "")
                    }
                  />
                  <AvatarFallback className="text-2xl">
                    {user?.fullName?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Label htmlFor="profile-photo">Foto Profil</Label>
                  <Input
                    ref={fileInputRef}
                    id="profile-photo"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={uploading}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <TbLoader className="animate-spin mr-2" />
                        Mengupload...
                      </>
                    ) : (
                      <>
                        <TbUpload className="mr-2" />
                        Upload Foto
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Format: JPG, PNG. Maksimal 5MB
                  </p>
                </div>
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-center gap-2 text-sm">
                  <TbAlertCircle /> {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm">
                  {success}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">
                Nama Lengkap
              </label>
              <p className="text-lg">{user?.fullName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-lg">{user?.email}</p>
            </div>
            {user?.nim && (
              <div>
                <label className="text-sm font-medium text-gray-500">NIM</label>
                <p className="text-lg">{user.nim}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </BuyerLayout>

      {/* Crop Dialog */}
      <Dialog open={isCropping} onOpenChange={setIsCropping}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sesuaikan Foto</DialogTitle>
            <DialogDescription>
              Geser dan zoom untuk menyesuaikan foto profil Anda.
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCropping(false)} disabled={uploading}>
              Batal
            </Button>
            <Button onClick={handleCropConfirm} disabled={uploading}>
              {uploading ? "Menyimpan..." : "Simpan Foto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
