"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";

interface PendingService {
  id: string;
  title: string;
  description: string;
  images: string[];
  category: string;
  price: number;
  pricingType?: string;
  pricePerUnit?: number;
  seller: { id: string; fullName: string };
}

const categoryNames: Record<string, string> = {
  DESIGN: "Desain",
  DATA: "Data",
  CODING: "Pemrograman",
  WRITING: "Penulisan",
  EVENT: "Acara",
  TUTOR: "Tutor",
  TECHNICAL: "Teknis",
  OTHER: "Lainnya",
};

const AdminReviewsPage = () => {
  const [services, setServices] = useState<PendingService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("/api/admin/services/pending", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setServices(data.data || []);
      } else {
        setServices([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getPriceDisplay = (service: PendingService) => {
    const format = (p: number) =>
      new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(p);

    if (service.pricingType === "FIXED" || !service.pricingType) {
      return format(service.price);
    } else if (service.pricingType === "CUSTOM") {
      return `Mulai ${format(service.price)}`;
    } else {
      const unit = service.pricingType.replace("PER_", "").toLowerCase();
      return `${format(service.pricePerUnit || service.price)} / ${unit}`;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Review Jasa</h1>
          <p className="text-muted-foreground">
            Daftar jasa yang menunggu persetujuan administrator
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        ) : services.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Tidak ada jasa yang menunggu review saat ini.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s) => (
              <Card key={s.id} className="overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                <div className="relative aspect-video w-full bg-gray-100">
                  {s.images?.[0] ? (
                    <Image
                      src={s.images[0]}
                      alt={s.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="text-4xl">📦</span>
                    </div>
                  )}
                  <Badge className="absolute top-2 right-2 bg-yellow-500 hover:bg-yellow-600 shadow-sm">
                    PENDING
                  </Badge>
                </div>
                <CardContent className="flex flex-col flex-1 p-5">
                  <div className="flex-1">
                    <Badge variant="secondary" className="mb-2 text-xs font-normal">
                      {categoryNames[s.category] || s.category}
                    </Badge>
                    <h3 className="font-semibold text-lg text-foreground mb-1 line-clamp-1" title={s.title}>
                      {s.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      oleh <span className="font-medium text-foreground">{s.seller.fullName}</span>
                    </p>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {s.description}
                    </p>
                  </div>

                  <div className="mt-auto space-y-3 pt-3 border-t">
                    <p className="font-bold text-primary text-lg">
                      {getPriceDisplay(s)}
                    </p>
                    <Link href={`/admin/reviews/${s.id}`} className="block">
                      <Button className="w-full">
                        Lihat Detail & Review
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminReviewsPage;
