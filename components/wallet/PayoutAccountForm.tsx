"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { TbCreditCard } from "react-icons/tb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface PayoutAccountFormData {
  bankName: string;
  accountName: string;
  accountNumber: string;
}

interface PayoutAccountFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// Data bank dan e-wallet
const PAYMENT_PROVIDERS = [
  // Bank
  { value: "BCA", label: "BCA", type: "bank", logo: "🏦" },
  { value: "Mandiri", label: "Mandiri", type: "bank", logo: "🏦" },
  { value: "BNI", label: "BNI", type: "bank", logo: "🏦" },
  { value: "BRI", label: "BRI", type: "bank", logo: "🏦" },
  { value: "Bank Riau Kepri", label: "Bank Riau Kepri", type: "bank", logo: "🏦" },
  { value: "CIMB Niaga", label: "CIMB Niaga", type: "bank", logo: "🏦" },
  { value: "Permata Bank", label: "Permata Bank", type: "bank", logo: "🏦" },
  { value: "Danamon", label: "Danamon", type: "bank", logo: "🏦" },
  { value: "BSI", label: "BSI (Bank Syariah Indonesia)", type: "bank", logo: "🏦" },
  // E-Wallet
  { value: "GoPay", label: "GoPay", type: "ewallet", logo: "💳" },
  { value: "OVO", label: "OVO", type: "ewallet", logo: "💳" },
  { value: "Dana", label: "Dana", type: "ewallet", logo: "💳" },
  { value: "ShopeePay", label: "ShopeePay", type: "ewallet", logo: "💳" },
  { value: "LinkAja", label: "LinkAja", type: "ewallet", logo: "💳" },
];

const PayoutAccountForm = ({
  open,
  onOpenChange,
  onSuccess,
}: PayoutAccountFormProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<PayoutAccountFormData>({
    bankName: "",
    accountName: "",
    accountNumber: "",
  });

  const handleChange = (field: keyof PayoutAccountFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSubmit = async () => {
    if (!formData.bankName || !formData.accountName || !formData.accountNumber) {
      setError("Semua field wajib diisi");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch("/api/wallet/payout-accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onOpenChange(false);
        // Reset form
        setFormData({ bankName: "", accountName: "", accountNumber: "" });
      } else {
        setError(data.error || "Gagal menambahkan rekening");
      }
    } catch (err) {
      setError("Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  };

  const selectedProvider = PAYMENT_PROVIDERS.find(
    (p) => p.value === formData.bankName
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[80vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <TbCreditCard /> Tambah Metode Penarikan
          </DrawerTitle>
          <DrawerDescription>
            Pilih bank atau e-wallet untuk penarikan dana Anda.
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 overflow-y-auto">
          <div className="space-y-4 pb-6">
            {/* Bank/E-Wallet Selection */}
            <div className="space-y-2">
              <Label htmlFor="bankName">Pilih Bank atau E-Wallet</Label>
              <Select
                value={formData.bankName}
                onValueChange={(value) => handleChange("bankName", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih metode penarikan">
                    {selectedProvider && (
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{selectedProvider.logo}</span>
                        <span>{selectedProvider.label}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {/* Bank Section */}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    BANK
                  </div>
                  {PAYMENT_PROVIDERS.filter((p) => p.type === "bank").map(
                    (provider) => (
                      <SelectItem key={provider.value} value={provider.value}>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{provider.logo}</span>
                          <span>{provider.label}</span>
                        </div>
                      </SelectItem>
                    )
                  )}

                  {/* E-Wallet Section */}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2 border-t">
                    E-WALLET
                  </div>
                  {PAYMENT_PROVIDERS.filter((p) => p.type === "ewallet").map(
                    (provider) => (
                      <SelectItem key={provider.value} value={provider.value}>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{provider.logo}</span>
                          <span>{provider.label}</span>
                        </div>
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Account Name */}
            <div className="space-y-2">
              <Label htmlFor="accountName">
                {selectedProvider?.type === "ewallet"
                  ? "Nama Pemilik Akun"
                  : "Nama Pemilik Rekening"}
              </Label>
              <Input
                id="accountName"
                value={formData.accountName}
                onChange={(e) => handleChange("accountName", e.target.value)}
                placeholder={
                  selectedProvider?.type === "ewallet"
                    ? "Nama sesuai akun e-wallet"
                    : "Sesuai nama di buku tabungan"
                }
                required
              />
            </div>

            {/* Account Number */}
            <div className="space-y-2">
              <Label htmlFor="accountNumber">
                {selectedProvider?.type === "ewallet"
                  ? "Nomor HP/Akun"
                  : "Nomor Rekening"}
              </Label>
              <Input
                id="accountNumber"
                type="tel"
                value={formData.accountNumber}
                onChange={(e) => handleChange("accountNumber", e.target.value)}
                placeholder={
                  selectedProvider?.type === "ewallet"
                    ? "Contoh: 08123456789"
                    : "Contoh: 1234567890"
                }
                required
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                {error}
              </div>
            )}
          </div>
        </div>

        <DrawerFooter>
          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? "Menyimpan..." : "Simpan Metode Penarikan"}
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

export default PayoutAccountForm;