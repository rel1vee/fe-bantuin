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
import Image from "next/image";

export default function BuyerSettingsPage() {
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const result = await uploadAccountPhoto(
        files[0],
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
        await refreshUser();
      } else {
        throw new Error("Gagal mengupdate foto profil");
      }
    } catch (err: any) {
      setError(err.message || "Gagal mengupload foto");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
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
                <AvatarImage src={user?.profilePicture || ""} />
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
  );
}
