"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import SellerLayout from "@/components/layouts/SellerLayout";
import { Button } from "@/components/ui/button";
import {
  TbPackage,
  TbShoppingCart,
  TbStar,
  TbChartLine,
  TbPlus,
} from "react-icons/tb";

const SellerDashboardPage = () => {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push("/");
      } else if (!user?.isSeller) {
        router.push("/seller/activate");
      }
    }
  }, [loading, isAuthenticated, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user?.isSeller) {
    return null;
  }

  return (
    <SellerLayout>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Selamat datang, {user.fullName}! 👋
        </h1>
        <p className="text-gray-600">
          Berikut adalah ringkasan aktivitas anda hari ini
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Jasa */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <TbPackage className="text-2xl text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">0</p>
          <p className="text-sm text-gray-500">Total Jasa</p>
        </div>

        {/* Pesanan Aktif */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <TbShoppingCart className="text-2xl text-yellow-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">0</p>
          <p className="text-sm text-gray-500">Pesanan Aktif</p>
        </div>

        {/* Rating */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <TbStar className="text-2xl text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {Number(user.avgRating).toFixed(1)}
          </p>
          <p className="text-sm text-gray-500">{user.totalReviews} Ulasan</p>
        </div>

        {/* Pesanan Selesai */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <TbChartLine className="text-2xl text-purple-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {user.totalOrdersCompleted}
          </p>
          <p className="text-sm text-gray-500">Selesai</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            className="w-full justify-center"
            onClick={() => router.push("/seller/services")}
          >
            <TbPlus className="mr-2" /> Tambah Jasa Baru
          </Button>
          <Button
            variant="outline"
            className="w-full justify-center"
            onClick={() => router.push("/seller/orders")}
          >
            <TbShoppingCart className="mr-2" /> Lihat Pesanan
          </Button>
          <Button
            variant="outline"
            className="w-full justify-center"
            onClick={() => router.push("/seller/stats")}
          >
            <TbChartLine className="mr-2" /> Lihat Statistik
          </Button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Pesanan Terbaru
            </h3>
          </div>
          <div className="p-6">
            <div className="text-center py-12">
              <TbShoppingCart className="mx-auto text-5xl text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">Belum ada pesanan</p>
              <p className="text-sm text-gray-400 mt-1">
                Pesanan akan muncul di sini
              </p>
            </div>
          </div>
        </div>

        {/* Performance */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Performa Bulan Ini
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Pesanan</span>
                <span className="text-sm font-semibold text-gray-900">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pesanan Selesai</span>
                <span className="text-sm font-semibold text-gray-900">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tingkat Respon</span>
                <span className="text-sm font-semibold text-gray-900">-</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SellerLayout>
  );
};
export default SellerDashboardPage;
