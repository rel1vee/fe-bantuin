"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "./ui/button";
import { getCloudinaryUrl } from "@/lib/cloudinary";

const videoSrc = getCloudinaryUrl("v1765990209/bg_x0rahs.mp4", "video");
const imageSrc = getCloudinaryUrl("v1765990224/service_1_itxze3.jpg", "image");

const Hero = () => {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  return (
    <section className="relative w-full h-[70vh] overflow-hidden">
      {/* Image Placeholder - Only show while video is loading */}
      {!isVideoLoaded && <Image src={imageSrc} alt="Bantuin background placeholder" fill priority sizes="100vw" unoptimized className="object-cover" />}

      {/* Video Background */}
      <video autoPlay loop muted playsInline preload="auto" onLoadedData={() => setIsVideoLoaded(true)} className="absolute top-0 left-0 w-full h-full object-cover">
        <source src={videoSrc} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Dark Overlay */}
      <div className="absolute top-0 left-0 w-full h-full bg-black/70"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center h-full px-4 sm:px-6 md:px-12 lg:px-48">
        <h1 className="font-display font-light text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white mb-6">
          Temukan Bantuan di <span className="text-secondary">Bantuin</span>
        </h1>

        <p className="text-white/90 text-base sm:text-lg md:text-xl max-w-3xl">Platform marketplace jasa yang bakal ngehubungin antara si penyedia dan pengguna jasa oleh dan buat mahasiswa di kampus UIN Suska Riau</p>

        {/* Optional: Search Bar */}
        <div className="mt-12 w-full max-w-2xl">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari layanan yang kamu butuhin..."
              className="w-full px-6 py-4 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-secondary"
            />
            <Button className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md">Cari</Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
