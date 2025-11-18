"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TbStar, TbMapPin } from "react-icons/tb";

interface ServiceCardProps {
  service: {
    id: string;
    title: string;
    description: string;
    category: string;
    price: number;
    deliveryTime: number;
    images: string[];
    avgRating: number;
    totalReviews: number;
    seller: {
      id: string;
      fullName: string;
      profilePicture: string | null;
      major: string | null;
      batch: string | null;
      avgRating: number;
    };
  };
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

const ServiceCard = ({ service }: ServiceCardProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Link href={`/services/${service.id}`}>
      <Card className="overflow-hidden cursor-pointer hover:shadow-xl py-0 transition-all duration-300 border border-gray-200 hover:border-green-300">
        {/* Image with Badge */}
        <div className="relative h-48 group">
          {service.images && service.images.length > 0 ? (
            <Image
              src={service.images[0]}
              alt={service.title}
              fill
              sizes="400px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-muted">
              <span className="text-4xl text-muted-foreground">📦</span>
            </div>
          )}

          {/* Major & Batch Badge (if available) */}
          {service.seller.major && (
            <Badge className="absolute top-3 normal-case right-3 bg-secondary text-white border-0">
              {service.seller.major}
              {service.seller.batch && ` • ${service.seller.batch}`}
            </Badge>
          )}
        </div>

        <CardContent className="p-4">
          {/* Provider Info */}
          <div className="flex items-start gap-3 mb-3">
            <Image
              src={service.seller.profilePicture || "/placeholder-avatar.png"}
              alt={service.seller.fullName}
              width={40}
              height={40}
              className="rounded-full object-cover shrink-0 ring-2 ring-gray-100"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold mb-1 line-clamp-2 leading-tight">
                {service.title}
              </h3>
              <p className="text-sm text-gray-600">{service.seller.fullName}</p>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
            {service.description}
          </p>

          {/* Rating & Reviews */}
          <div className="flex items-center gap-4 mb-3 text-sm">
            <div className="flex items-center gap-1">
              <TbStar className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">
                {service.avgRating > 0 ? service.avgRating.toFixed(1) : "Baru"}
              </span>
              {service.totalReviews > 0 && (
                <span className="text-gray-400">({service.totalReviews})</span>
              )}
            </div>
          </div>

          {/* Category Tag */}
          <div className="mb-4">
            <Badge
              variant="outline"
              className={`text-xs px-2 py-0.5 ${
                categoryColors[service.category]
              }`}
            >
              {categoryNames[service.category]}
            </Badge>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div>
              <p className="text-xs text-secondary mb-0.5">Mulai dari</p>
              <p className="font-semibold text-primary">
                {formatPrice(service.price)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ServiceCard;
