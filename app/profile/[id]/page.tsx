"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import PublicLayout from "@/components/layouts/PublicLayout";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
    TbUser,
    TbBriefcase,
    TbMail,
    TbSchool,
    TbId,
    TbStar,
    TbTrophy,
    TbCoin,
    TbPackage,
    TbBrandInstagram,
    TbBrandLinkedin,
    TbBrandTwitter,
    TbBrandGithub,
    TbWorld,
} from "react-icons/tb";
import { toast } from "sonner";
import { ReportUserDialog } from "@/components/report/ReportUserDialog";
import { TbFlag } from "react-icons/tb";
import { useAuth } from "@/contexts/AuthContext";

interface PublicUser {
    id: string;
    fullName: string;
    email?: string; // Maybe hide email for public? Or show if provided? Let's check API.
    profilePicture: string | null;
    coverPicture: string | null;
    bio: string | null;
    nim: string | null;
    major: string | null;
    batch: string | null;
    isSeller: boolean;
    isVerified: boolean;
    avgRating: number;
    totalReviews: number;
    totalOrdersCompleted: number;
    socialMedia?: {
        instagram?: string;
        linkedin?: string;
        twitter?: string;
        website?: string;
        github?: string;
    };
    createdAt: string;
}

interface SellerStats {
    stats: {
        totalServices: number;
        activeOrders: number;
        completedOrders: number;
        totalRevenue: number;
    };
}

export default function PublicProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { user: currentUser } = useAuth();
    const [user, setUser] = useState<PublicUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [sellerStats, setSellerStats] = useState<SellerStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/users/public/${params.id}`);
                const data = await res.json();

                if (data.success) {
                    setUser(data.data);
                } else {
                    toast.error("Pengguna tidak ditemukan");
                    router.push("/");
                }
            } catch (error) {
                console.error("Error fetching user:", error);
                toast.error("Gagal memuat profil pengguna");
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchUser();
        }
    }, [params.id, router]);

    // Fetch Seller Stats only if user is seller
    useEffect(() => {
        // Note: We need a public endpoint for seller stats if we want to show them?
        // The current endpoint /api/users/seller/stats uses @GetUser('id'), so it only works for the logged in user own stats.
        // For other users, we might check `getSellerStats` in `users.service` but controller limits it.
        // However, the public profile usually shows public stats (reviews, orders completed) which are already in User object.
        // Detailed stats like Revenue are PRIVATE. Active orders/Total Services could be public.
        // Let's stick to what's in the PublicUser object for now.
        // We already have avgRating, totalReviews, totalOrdersCompleted.
        // We don't have totalServices count in user object currently.
    }, [user]);

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    if (loading) {
        return (
            <PublicLayout>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </PublicLayout>
        );
    }

    if (!user) return null;

    return (
        <PublicLayout>
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="container mx-auto px-4 max-w-5xl">
                    {/* 1. Profile Header Card */}
                    <Card className="mb-8 border-none shadow-md overflow-hidden">
                        <div className="h-32 relative bg-gray-200">
                            {user.coverPicture ? (
                                <Image
                                    src={user.coverPicture}
                                    alt="Cover"
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            ) : (
                                <div className="absolute inset-0 bg-linear-to-r from-primary to-secondary">
                                    <div className="absolute inset-0 bg-grid-white/10" />
                                </div>
                            )}
                        </div>

                        <CardContent className="relative pt-0 px-8 pb-8">
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 -mt-12">
                                <Avatar className="w-32 h-32 border-4 border-white shadow-lg shrink-0">
                                    <AvatarImage
                                        src={user.profilePicture || ""}
                                        alt={user.fullName}
                                    />
                                    <AvatarFallback className="text-4xl bg-primary text-white">
                                        {getInitials(user.fullName)}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="flex-1 space-y-1 mt-4 md:mt-8">
                                    <div className="flex flex-col md:flex-row md:items-center gap-2">
                                        <h1 className="text-3xl font-bold text-gray-900">
                                            {user.fullName}
                                        </h1>
                                        {user.isVerified && (
                                            <Badge
                                                variant="secondary"
                                                className="bg-blue-100 text-blue-700 border-blue-200 w-fit"
                                            >
                                                Terverifikasi
                                            </Badge>
                                        )}
                                    </div>
                                    {/* Hide email for public profile usually, or show if backend returns it */}
                                    {/* <p className="text-muted-foreground">{user.email}</p> */}
                                </div>

                                <div className="flex gap-3 mt-4 md:mt-0 md:mb-2">
                                    {/* Report Button */}
                                    {currentUser?.id !== user.id && (
                                        <ReportUserDialog
                                            reportedUserId={user.id}
                                            reportedUserName={user.fullName}
                                            trigger={
                                                <Button variant="outline" className="text-destructive hover:text-destructive">
                                                    <TbFlag className="mr-2 h-4 w-4" /> Laporkan
                                                </Button>
                                            }
                                        />
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 2. Tabs Section */}
                    <Tabs defaultValue="pengguna" className="space-y-6">
                        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                            <TabsTrigger value="pengguna" className="gap-2">
                                <TbUser className="h-4 w-4" /> Profil Pengguna
                            </TabsTrigger>
                            <TabsTrigger value="penyedia" className="gap-2">
                                <TbBriefcase className="h-4 w-4" /> Profil Penyedia
                            </TabsTrigger>
                        </TabsList>

                        {/* --- TAB 1: PENGGUNA (BUYER) --- */}
                        <TabsContent
                            value="pengguna"
                            className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Info Akademik */}
                                <Card className="md:col-span-1 h-fit">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <TbSchool className="text-primary" /> Info Akademik
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* NIM hidden for privacy usually? Or show? User asked: "like profile page". Profile page shows it. */}
                                        {/* Let's show if backend provided it. My fetchPublicProfile did not include NIM actually. */}
                                        {user.major && (
                                            <div>
                                                <p className="text-xs text-muted-foreground uppercase font-semibold">
                                                    Jurusan
                                                </p>
                                                <p className="font-medium">{user.major || "-"}</p>
                                            </div>
                                        )}
                                        {user.major && <Separator />}
                                        {user.batch && (
                                            <div>
                                                <p className="text-xs text-muted-foreground uppercase font-semibold">
                                                    Angkatan
                                                </p>
                                                <p className="font-medium">{user.batch || "-"}</p>
                                            </div>
                                        )}
                                        {(!user.major && !user.batch) && <p className="text-sm text-muted-foreground">Tidak ada informasi akademik.</p>}
                                    </CardContent>
                                </Card>

                                {/* Bio & Kontak */}
                                <Card className="md:col-span-2">
                                    <CardHeader>
                                        <CardTitle>Informasi Pribadi</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="bg-muted/30 p-4 rounded-lg border">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="text-sm font-semibold text-foreground">
                                                    Bio / Deskripsi Diri
                                                </h4>
                                            </div>
                                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                                {user.bio ||
                                                    "Belum ada deskripsi diri."}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Media Sosial */}
                                <Card className="md:col-span-3">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                        <CardTitle className="text-lg font-medium">Media Sosial</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-4">
                                            {(!user.socialMedia || Object.values(user.socialMedia).every(v => !v || v === "")) && (
                                                <p className="text-muted-foreground text-sm italic">Belum ada media sosial yang ditautkan.</p>
                                            )}

                                            {/* @ts-ignore */}
                                            {user.socialMedia?.instagram && (
                                                <a href={user.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-pink-50 text-pink-600 rounded-full hover:bg-pink-100 transition-colors">
                                                    <TbBrandInstagram className="h-5 w-5" />
                                                    <span className="font-medium">Instagram</span>
                                                </a>
                                            )}
                                            {/* @ts-ignore */}
                                            {user.socialMedia?.linkedin && (
                                                <a href={user.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors">
                                                    <TbBrandLinkedin className="h-5 w-5" />
                                                    <span className="font-medium">LinkedIn</span>
                                                </a>
                                            )}
                                            {/* @ts-ignore */}
                                            {user.socialMedia?.twitter && (
                                                <a href={user.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-sky-50 text-sky-500 rounded-full hover:bg-sky-100 transition-colors">
                                                    <TbBrandTwitter className="h-5 w-5" />
                                                    <span className="font-medium">Twitter / X</span>
                                                </a>
                                            )}
                                            {/* @ts-ignore */}
                                            {user.socialMedia?.github && (
                                                <a href={user.socialMedia.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-800 rounded-full hover:bg-gray-200 transition-colors">
                                                    <TbBrandGithub className="h-5 w-5" />
                                                    <span className="font-medium">GitHub</span>
                                                </a>
                                            )}
                                            {/* @ts-ignore */}
                                            {user.socialMedia?.website && (
                                                <a href={user.socialMedia.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition-colors">
                                                    <TbWorld className="h-5 w-5" />
                                                    <span className="font-medium">Website</span>
                                                </a>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* --- TAB 2: PENYEDIA (SELLER) --- */}
                        <TabsContent
                            value="penyedia"
                            className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2"
                        >
                            {user.isSeller ? (
                                <>
                                    {/* Seller Stats Cards */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Card>
                                            <CardContent className="p-6 flex flex-col gap-2">
                                                <span className="text-muted-foreground text-xs uppercase font-bold">
                                                    Rating
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <TbStar className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                                                    <span className="text-3xl font-bold">
                                                        {Number(user.avgRating).toFixed(1)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Dari {user.totalReviews} ulasan
                                                </p>
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardContent className="p-6 flex flex-col gap-2">
                                                <span className="text-muted-foreground text-xs uppercase font-bold">
                                                    Pesanan Selesai
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <TbTrophy className="h-6 w-6 text-primary" />
                                                    <span className="text-3xl font-bold">
                                                        {user.totalOrdersCompleted}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Total Proyek Sukses
                                                </p>
                                            </CardContent>
                                        </Card>

                                        {/* Revenue and Active services are hidden for privacy mostly, or we can show active services count if we fetch it. 
                        Let's keep it simple.
                    */}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    Pengguna ini bukan penyedia jasa.
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </PublicLayout>
    );
}
