"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import PublicLayout from "@/components/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import { ReportUserDialog } from "@/components/report/ReportUserDialog"; // <--- IMPORT INI

import {
  TbStar,
  TbClock,
  TbRefresh,
  TbShoppingCart,
  TbEyeOff,
  TbCheck,
  TbShield,
  TbBadgeCc,
  TbMessageCircle,
  TbChevronLeft,
  TbChevronRight,
  TbFlag, // <--- Pastikan ini diimport
} from "react-icons/tb";

// ... (Interface ServiceDetail tetap sama)
interface ServiceDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  deliveryTime: number;
  revisions: number;
  images: string[];
  avgRating: number;
  totalReviews: number;
  totalOrders: number;
  isActive: boolean;
  status: string;
  adminNotes?: string | null;
  seller: {
    id: string;
    fullName: string;
    profilePicture: string | null;
    bio: string | null;
    major: string | null;
    batch: string | null;
    avgRating: number;
    totalReviews: number;
    totalOrdersCompleted: number;
    createdAt: string;
  };
  reviews: Array<{
    id: string;
    rating: number;
    comment: string;
    sellerResponse: string | null;
    createdAt: string;
    author: {
      id: string;
      fullName: string;
      profilePicture: string | null;
      major: string | null;
    };
  }>;
}

const categoryColors: Record<string, string> = {
  DESIGN: "bg-purple-100 text-purple-700 border-purple-200",
  DATA: "bg-green-100 text-green-700 border-green-200",
  CODING: "bg-blue-100 text-blue-700 border-blue-200",
  WRITING: "bg-orange-100 text-orange-700 border-orange-200",
  EVENT: "bg-pink-100 text-pink-700 border-pink-200",
  TUTOR: "bg-indigo-100 text-indigo-700 border-indigo-200",
  TECHNICAL: "bg-red-100 text-red-700 border-red-200",
  OTHER: "bg-gray-100 text-gray-700 border-gray-200",
};

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

const ServiceDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [currentTab, setCurrentTab] = useState("ringkasan");
  const { openChatWith } = useChat();

  useEffect(() => {
    const fetchService = async () => {
      try {
        const response = await fetch(`/api/services/${params.id}`);
        const data = await response.json();

        if (data.success) {
          const serviceData: ServiceDetail = data.data;
          const isOwner = user?.id === serviceData.seller.id;
          const isPubliclyActive =
            serviceData.status === "ACTIVE" && serviceData.isActive;

          if (isPubliclyActive || isOwner) {
            setService(serviceData);
          } else {
            router.push("/services");
          }
        } else {
          router.push("/services");
        }
      } catch (error) {
        console.error("Error fetching service:", error);
        router.push("/services");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchService();
    }
  }, [params.id, router, user, authLoading]);

  const handleOrder = () => {
    if (!isAuthenticated) {
      router.push("/");
      return;
    }
    router.push(`/orders/create?serviceId=${params.id}`);
  };

  const handleChatSeller = () => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    if (service) {
      const servicePreview = {
        id: service.id,
        title: service.title,
        price: service.price,
        image: service.images[0] || "",
        sellerId: service.seller.id,
      };

      openChatWith(
        {
          id: service.seller.id,
          fullName: service.seller.fullName,
          profilePicture: service.seller.profilePicture,
        },
        undefined,
        servicePreview
      );
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handlePrevImage = () => {
    if (service) {
      setSelectedImage((prev) =>
        prev === 0 ? service.images.length - 1 : prev - 1
      );
    }
  };

  const handleNextImage = () => {
    if (service) {
      setSelectedImage((prev) =>
        prev === service.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  if (loading || authLoading) {
    return (
      <PublicLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </PublicLayout>
    );
  }

  if (!service) {
    return null;
  }

  const isOwner = isAuthenticated && user?.id === service.seller.id;
  const isInactive = !service.isActive || service.status !== "ACTIVE";

  return (
    <PublicLayout>
      <div className="min-h-screen  py-8">
        <div className="container mx-auto px-4">
          {/* Status Banner for Owner */}
          {isOwner && service.status === "PENDING" && (
            <div className="mb-4 p-3 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800">
              Jasa ini sedang menunggu persetujuan administrator. Anda akan
              diberitahu setelah ditinjau.
            </div>
          )}
          {isOwner && service.status === "REJECTED" && (
            <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-800">
              Jasa ini ditolak oleh administrator.{" "}
              {service.adminNotes
                ? `Alasan: ${service.adminNotes}`
                : "Silakan periksa dan perbarui informasinya."}
            </div>
          )}
          {/* Breadcrumb */}
          <div className="mb-6 text-sm text-gray-600">
            <span
              className="hover:text-primary cursor-pointer"
              onClick={() => router.push("/")}
            >
              Home
            </span>
            <span className="mx-2">/</span>
            <span
              className="hover:text-primary cursor-pointer"
              onClick={() => router.push("/services")}
            >
              Jasa
            </span>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{service.title}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image Slideshow */}
              <Card className="overflow-hidden py-0 border-2 border-secondary">
                <div className="relative w-full aspect-video bg-gray-100">
                  {service.images.length > 0 ? (
                    <Image
                      src={service.images[selectedImage]}
                      alt={service.title}
                      fill
                      sizes="1080"
                      className="object-cover"
                      loading="eager"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="text-6xl">📦</span>
                    </div>
                  )}

                  {/* Navigation Arrows */}
                  {service.images.length > 1 && (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 hover:bg-white shadow-lg"
                        onClick={handlePrevImage}
                      >
                        <TbChevronLeft className="h-6 w-6" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 hover:bg-white shadow-lg"
                        onClick={handleNextImage}
                      >
                        <TbChevronRight className="h-6 w-6" />
                      </Button>

                      {/* Image Counter */}
                      <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                        {selectedImage + 1} / {service.images.length}
                      </div>
                    </>
                  )}
                </div>
              </Card>

              {/* Service Info with Tabs */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="mb-3">
                    <Badge
                      variant="outline"
                      className={categoryColors[service.category]}
                    >
                      {categoryNames[service.category]}
                    </Badge>
                  </div>

                  <CardTitle className="text-2xl mb-2 font-display">
                    {service.title}
                  </CardTitle>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <TbStar className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">
                        {Number(service.avgRating) > 0
                          ? Number(service.avgRating).toFixed(1)
                          : "Baru"}
                      </span>
                      {service.totalReviews > 0 && (
                        <span className="text-gray-400">
                          ({service.totalReviews} ulasan)
                        </span>
                      )}
                    </div>

                    <Separator orientation="vertical" className="h-4" />

                    <div className="text-gray-600">
                      {service.totalOrders} pesanan
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <Tabs
                    value={currentTab}
                    onValueChange={setCurrentTab}
                    className="w-full"
                  >
                    <TabsList className="w-full grid grid-cols-3 mb-6">
                      <TabsTrigger value="ringkasan">Ringkasan</TabsTrigger>
                      <TabsTrigger value="freelancer">Penyedia</TabsTrigger>
                      <TabsTrigger value="ulasan">Ulasan</TabsTrigger>
                    </TabsList>

                    {/* Ringkasan Tab */}
                    <TabsContent value="ringkasan" className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-3">
                          Deskripsi Layanan
                        </h3>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {service.description}
                        </p>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="text-lg font-semibold mb-3">
                          Yang Akan Anda Dapatkan
                        </h3>
                        <ul className="space-y-2">
                          <li className="flex items-start gap-2">
                            <TbCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                            <span className="text-gray-700">
                              Layanan profesional dan terpercaya
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <TbCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                            <span className="text-gray-700">
                              Garansi kepuasan pelanggan
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <TbCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                            <span className="text-gray-700">
                              Komunikasi yang responsif
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <TbCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                            <span className="text-gray-700">
                              Revisi sesuai kesepakatan
                            </span>
                          </li>
                        </ul>
                      </div>
                    </TabsContent>

                    {/* Freelancer Tab */}
                    <TabsContent value="freelancer" className="space-y-4">
                      <div
                        className="flex items-start gap-4 cursor-pointer p-4 rounded-lg transition-colors -mx-4"
                        onClick={() =>
                          router.push(`/profile/${service.seller.id}`)
                        }
                      >
                        <Avatar className="h-20 w-20">
                          <AvatarImage
                            src={service.seller.profilePicture || ""}
                            alt={service.seller.fullName}
                          />
                          <AvatarFallback className="bg-primary text-white text-lg">
                            {getInitials(service.seller.fullName)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-xl font-semibold">
                                {service.seller.fullName}
                              </h3>
                              {service.seller.major && (
                                <p className="text-sm text-gray-600">
                                  {service.seller.major}
                                  {service.seller.batch &&
                                    ` • Angkatan ${service.seller.batch}`}
                                </p>
                              )}
                            </div>

                            {/* BUTTON REPORT DI SINI */}
                            {isAuthenticated &&
                              user?.id !== service.seller.id && (
                                <div onClick={(e) => e.stopPropagation()}>
                                  <ReportUserDialog
                                    reportedUserId={service.seller.id}
                                    reportedUserName={service.seller.fullName}
                                    trigger={
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-muted-foreground hover:text-destructive h-auto py-1 px-2"
                                      >
                                        <TbFlag className="w-4 h-4 mr-1" />
                                        <span className="text-xs">
                                          Laporkan
                                        </span>
                                      </Button>
                                    }
                                  />
                                </div>
                              )}
                          </div>

                          <div className="flex items-center gap-1 text-sm text-gray-600 mt-2">
                            <TbStar className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">
                              {Number(service.seller.avgRating || 0).toFixed(1)}
                            </span>
                            <span className="text-gray-400">
                              ({service.seller.totalReviews} ulasan)
                            </span>
                          </div>

                          {service.seller.bio && (
                            <p className="mt-3 text-sm text-gray-700 leading-relaxed">
                              {service.seller.bio}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-2xl font-semibold text-primary mb-1">
                            {service.seller.totalOrdersCompleted}
                          </p>
                          <p className="text-xs text-gray-600">
                            Pesanan Selesai
                          </p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-2xl font-semibold text-primary mb-1">
                            {service.seller.totalReviews}
                          </p>
                          <p className="text-xs text-gray-600">Total Ulasan</p>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Ulasan Tab */}
                    <TabsContent value="ulasan" className="space-y-6">
                      {service.reviews.length > 0 ? (
                        service.reviews.map((review) => (
                          <div
                            key={review.id}
                            className="border-b last:border-0 pb-6 last:pb-0"
                          >
                            <div className="flex items-start gap-3 mb-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage
                                  src={review.author.profilePicture || ""}
                                  alt={review.author.fullName}
                                />
                                <AvatarFallback className="bg-primary text-white text-sm">
                                  {getInitials(review.author.fullName)}
                                </AvatarFallback>
                              </Avatar>

                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <div>
                                    <p className="font-medium">
                                      {review.author.fullName}
                                    </p>
                                    {review.author.major && (
                                      <p className="text-xs text-gray-500">
                                        {review.author.major}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                      <TbStar
                                        key={i}
                                        className={`h-4 w-4 ${
                                          i < review.rating
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "text-gray-300"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>

                                <p className="text-xs text-gray-500 mb-2">
                                  {formatDate(review.createdAt)}
                                </p>

                                <p className="text-sm text-gray-700 leading-relaxed">
                                  {review.comment}
                                </p>

                                {review.sellerResponse && (
                                  <div className="mt-3 pl-4 border-l-2 border-green-600">
                                    <p className="text-sm font-medium">
                                      Tanggapan Penyedia
                                    </p>
                                    <p className="text-sm text-gray-700 mt-1">
                                      {review.sellerResponse}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          Belum ada ulasan untuk layanan ini
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-4 space-y-4">
                {/* Warning Card */}
                {isInactive && (
                  <Card className="border-2 border-yellow-400 bg-yellow-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <TbEyeOff className="h-8 w-8 text-yellow-700 shrink-0" />
                        <div>
                          <p className="font-semibold text-yellow-800">
                            Jasa Tidak Aktif
                          </p>
                          <p className="text-sm text-yellow-700">
                            Hanya Anda yang dapat melihat halaman pratinjau ini.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Order Card */}
                <Card className="border-2 border-primary">
                  <CardContent className="p-6">
                    <div className="mb-6">
                      <p className="text-sm text-gray-500 mb-1">Mulai dari</p>
                      <p className="text-3xl font-bold text-primary mb-1">
                        Rp {Number(service.price).toLocaleString("id-ID")}
                      </p>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <TbClock className="h-4 w-4" />
                          <span>Waktu Pengerjaan</span>
                        </div>
                        <span className="font-medium">
                          {service.deliveryTime} hari
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <TbRefresh className="h-4 w-4" />
                          <span>Revisi</span>
                        </div>
                        <span className="font-medium">
                          {service.revisions}x
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={handleOrder}
                      className="w-full mb-2"
                      size="lg"
                      disabled={isOwner || isInactive}
                    >
                      <TbShoppingCart className="mr-2" />
                      {isOwner
                        ? "Jasa Anda Sendiri"
                        : isInactive
                        ? "Jasa Tidak Tersedia"
                        : "Pesan Sekarang"}
                    </Button>

                    <Button
                      onClick={handleChatSeller}
                      variant="outline"
                      className="w-full"
                      size="lg"
                      disabled={isOwner || isInactive}
                    >
                      <TbMessageCircle className="mr-2 h-5 w-5" />
                      {isOwner
                        ? "Jasa Anda Sendiri"
                        : isInactive
                        ? "Jasa Tidak Tersedia"
                        : "Chat Penyedia"}
                    </Button>
                    {!isAuthenticated && (
                      <p className="text-xs text-center text-gray-500">
                        Login untuk melakukan pemesanan
                      </p>
                    )}

                    <Separator className="my-6" />

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <TbShield className="h-5 w-5 text-primary shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Pembayaran Aman</p>
                          <p className="text-xs text-gray-500">
                            Dana di-escrow hingga pekerjaan selesai
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <TbBadgeCc className="h-5 w-5 text-primary shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            Penyedia Terverifikasi
                          </p>
                          <p className="text-xs text-gray-500">
                            Identitas sudah diverifikasi
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <TbMessageCircle className="h-5 w-5 text-primary shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Dukungan 24/7</p>
                          <p className="text-xs text-gray-500">
                            Tim kami siap membantu Anda
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default ServiceDetailPage;
