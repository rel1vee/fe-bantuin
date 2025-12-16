"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import PublicLayout from "@/components/layouts/PublicLayout";
import Hero from "@/components/Hero";
import ServiceCard from "@/components/services/ServiceCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TbTrophy, TbStar, TbArrowRight, TbLoader } from "react-icons/tb";

function HomePageContent() {
  const [featuredServices, setFeaturedServices] = useState([]);
  const [topSellers, setTopSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch secara paralel agar lebih cepat
        const [servicesRes, sellersRes] = await Promise.all([
          fetch("/api/services/featured"),
          fetch("/api/users/top-sellers"),
        ]);

        const servicesData = await servicesRes.json();
        const sellersData = await sellersRes.json();

        if (servicesData.success) setFeaturedServices(servicesData.data);
        if (sellersData.success) setTopSellers(sellersData.data);
      } catch (error) {
        console.error("Failed to fetch home data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <PublicLayout>
      <Hero />

      {/* Section: Layanan Unggulan */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-bold font-display text-foreground">
                Layanan Pilihan
              </h2>
              <p className="text-muted-foreground mt-2">
                Jasa terbaik dengan rating tertinggi dari mahasiswa
              </p>
            </div>
            <Link href="/services">
              <Button variant="ghost" className="hidden md:flex gap-2">
                Lihat Semua <TbArrowRight />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <TbLoader className="animate-spin h-8 w-8 text-primary" />
            </div>
          ) : featuredServices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredServices.map((service: any) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              Belum ada jasa yang ditampilkan.
            </div>
          )}

          <div className="mt-8 text-center md:hidden">
            <Link href="/services">
              <Button variant="outline" className="w-full">
                Lihat Semua Jasa
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Section: Top Sellers */}
      <section className="py-16 bg-gray-50 border-y border-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-flex items-center justify-center p-3 bg-yellow-100 rounded-full mb-4">
              <TbTrophy className="h-6 w-6 text-yellow-600" />
            </span>
            <h2 className="text-3xl font-bold font-display text-foreground mb-2">
              Penyedia Terpopuler
            </h2>
            <p className="text-muted-foreground">
              Mahasiswa dengan reputasi terbaik bulan ini
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <TbLoader className="animate-spin h-8 w-8 text-primary" />
            </div>
          ) : topSellers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {topSellers.map((seller: any, index) => (
                <Card
                  key={seller.id}
                  className="hover:shadow-lg transition-all duration-300 border-none shadow-sm group"
                >
                  <CardContent className="p-6 text-center flex flex-col items-center">
                    <div className="relative mb-4">
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md z-10 border-2 border-white">
                        #{index + 1}
                      </div>
                      <Avatar className="w-24 h-24 border-4 border-white shadow-md group-hover:scale-105 transition-transform">
                        <AvatarImage src={seller.profilePicture} />
                        <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                          {seller.fullName[0]}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    <h3 className="font-bold text-lg text-foreground truncate w-full">
                      {seller.fullName}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3 truncate w-full">
                      {seller.major || "Mahasiswa UIN Suska"}
                    </p>

                    <div className="flex items-center justify-center gap-4 w-full py-3 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <div className="flex items-center gap-1 justify-center font-bold text-foreground">
                          <TbStar className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                          {Number(seller.avgRating).toFixed(1)}
                        </div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
                          Rating
                        </div>
                      </div>
                      <div className="w-px h-8 bg-gray-200"></div>
                      <div className="text-center">
                        <div className="font-bold text-foreground">
                          {seller.totalOrdersCompleted}
                        </div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
                          Selesai
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              Belum ada data penyedia.
            </div>
          )}
        </div>
      </section>

      {/* Call to Action (Sudah ada sebelumnya, bisa disesuaikan) */}
      {/* ... */}
    </PublicLayout>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}
