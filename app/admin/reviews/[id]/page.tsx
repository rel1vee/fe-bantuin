"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import Link from "next/link";
import {
    TbStar,
    TbClock,
    TbRefresh,
    TbCheck,
    TbShield,
    TbArrowLeft,
} from "react-icons/tb";

interface ServiceDetail {
    id: string;
    title: string;
    description: string;
    images: string[];
    category: string;
    price: number;
    pricingType?: string;
    pricePerUnit?: number;
    minimumOrder?: number;
    deliveryTime: number;
    revisions: number;
    requirements?: string;
    whatsIncluded?: string;
    additionalInfo?: string;
    faq?: Array<{ question: string; answer: string }>;
    status: string;
    isActive: boolean;
    seller: {
        id: string;
        fullName: string;
        email: string;
        major?: string;
        batch?: string;
        profilePicture?: string;
        bio?: string;
        avgRating?: number;
        totalReviews?: number;
        totalOrdersCompleted?: number
    };
    createdAt: string;
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

export default function ServiceReviewDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [service, setService] = useState<ServiceDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchService();
        }
    }, [id]);

    const fetchService = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("access_token");
            // Use admin protected endpoint for full access
            const res = await fetch(`/api/admin/services/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                console.error("Fetch failed:", res.status, res.statusText);
                let errorMessage = "Gagal mengambil data jasa.";
                try {
                    const data = await res.json();
                    errorMessage = data.message || data.error || errorMessage;
                } catch (e) {
                    // Ignore json parse error
                }

                if (res.status === 404) {
                    alert("Jasa tidak ditemukan.");
                } else if (res.status === 403) {
                    alert("Akses ditolak.");
                } else {
                    alert(errorMessage);
                }
                router.push("/admin/reviews");
                return;
            }

            const data = await res.json();
            if (data.success) {
                setService(data.data);
            } else {
                alert("Gagal memuat data jasa");
                router.push("/admin/reviews");
            }
        } catch (err) {
            console.error(err);
            alert("Terjadi kesalahan jaringan");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!confirm("Setujui jasa ini?")) return;
        try {
            const token = localStorage.getItem("access_token");
            const res = await fetch(`/api/admin/services/${id}/approve`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                alert("Jasa disetujui");
                router.push("/admin/reviews");
            } else {
                alert(data.error || "Gagal menyetujui jasa");
            }
        } catch (err) {
            console.error(err);
            alert("Terjadi kesalahan");
        }
    };

    const handleReject = async () => {
        const reason = prompt("Alasan penolakan:");
        if (reason === null) return;
        if (reason.trim().length === 0) {
            alert("Alasan harus diisi");
            return;
        }

        try {
            const token = localStorage.getItem("access_token");
            const res = await fetch(`/api/admin/services/${id}/reject`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ reason }),
            });
            const data = await res.json();
            if (data.success) {
                alert("Jasa ditolak");
                router.push("/admin/reviews");
            } else {
                alert(data.error || "Gagal menolak jasa");
            }
        } catch (err) {
            console.error(err);
            alert("Terjadi kesalahan");
        }
    };

    const getPriceDisplay = (svc: ServiceDetail) => {
        const format = (p: number) =>
            new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
            }).format(p);

        if (svc.pricingType === "FIXED" || !svc.pricingType) {
            return format(svc.price);
        } else if (svc.pricingType === "CUSTOM") {
            return `Mulai ${format(svc.price)}`;
        } else {
            const unit = svc.pricingType.replace("PER_", "").toLowerCase();
            return `${format(svc.pricePerUnit || svc.price)} / ${unit}`;
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

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
                </div>
            </AdminLayout>
        );
    }

    if (!service) return null; // Should have redirected

    return (
        <AdminLayout>
            <div className="space-y-6 max-w-7xl mx-auto">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/reviews")}>
                            <TbArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">Review Detail Jasa</h1>
                            <p className="text-muted-foreground flex items-center gap-2">
                                ID: {service.id}
                                <Badge variant={service.status === 'PENDING' ? 'outline' : 'default'} className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100">
                                    {service.status}
                                </Badge>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT COLUMN: Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Images */}
                        <Card className="overflow-hidden border-2 border-secondary/20 shadow-sm">
                            <div className="relative w-full aspect-video bg-gray-50 flex items-center justify-center">
                                {service.images[0] ? (
                                    <Image
                                        src={service.images[0]}
                                        alt={service.title}
                                        fill
                                        className="object-contain"
                                    />
                                ) : (
                                    <div className="text-4xl">📦</div>
                                )}
                            </div>
                            {service.images.length > 1 && (
                                <div className="flex gap-3 p-4 overflow-x-auto bg-white border-t">
                                    {service.images.map((img, i) => (
                                        <div key={i} className="relative w-20 h-20 shrink-0 rounded-md overflow-hidden border cursor-pointer hover:ring-2 hover:ring-primary">
                                            <Image src={img} alt="" fill className="object-cover" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>

                        {/* Details Tabs */}
                        <Card className="shadow-sm">
                            <CardHeader className="pb-4 border-b">
                                <div className="mb-3">
                                    <Badge variant="outline" className={categoryColors[service.category] || "bg-gray-100"}>
                                        {categoryNames[service.category] || service.category}
                                    </Badge>
                                </div>
                                <CardTitle className="text-2xl mb-2 font-display">{service.title}</CardTitle>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                        <TbStar className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                        <span className="font-medium">{service.seller.avgRating ? Number(service.seller.avgRating).toFixed(1) : 'New'}</span>
                                        <span className="text-gray-400">({service.seller.totalReviews || 0} ulasan)</span>
                                    </div>
                                    <Separator orientation="vertical" className="h-4" />
                                    <span>{new Date(service.createdAt).toLocaleDateString("id-ID", { dateStyle: 'long' })}</span>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <Tabs defaultValue="ringkasan" className="w-full">
                                    <TabsList className="w-full grid grid-cols-2 mb-6">
                                        <TabsTrigger value="ringkasan">Ringkasan Layanan</TabsTrigger>
                                        <TabsTrigger value="penyedia">Info Penyedia</TabsTrigger>
                                    </TabsList>

                                    {/* Ringkasan */}
                                    <TabsContent value="ringkasan" className="space-y-8 animate-in fade-in-50">
                                        <div>
                                            <h3 className="text-lg font-semibold mb-3 text-gray-900">Deskripsi Layanan</h3>
                                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{service.description}</p>
                                        </div>

                                        {(service.whatsIncluded || service.requirements) && <Separator />}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {service.whatsIncluded && (
                                                <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-100">
                                                    <h3 className="text-base font-semibold mb-3 text-emerald-900 flex items-center gap-2">
                                                        <TbCheck className="h-5 w-5 text-emerald-600" /> Yang Didapat
                                                    </h3>
                                                    <ul className="space-y-3">
                                                        {service.whatsIncluded.split('\n').filter(Boolean).map((line, i) => (
                                                            <li key={i} className="flex items-start gap-3">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                                                                <span className="text-gray-700 text-sm leading-relaxed">{line}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {service.requirements && (
                                                <div className="bg-amber-50/50 p-5 rounded-xl border border-amber-100">
                                                    <h3 className="text-base font-semibold mb-3 text-amber-900 flex items-center gap-2">
                                                        <TbShield className="h-5 w-5 text-amber-600" /> Persyaratan
                                                    </h3>
                                                    <p className="text-gray-700 text-sm whitespace-pre-line leading-relaxed">
                                                        {service.requirements}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {service.additionalInfo && (
                                            <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                                                <h4 className="font-semibold text-blue-900 mb-2">Informasi Tambahan</h4>
                                                <p className="text-sm text-blue-800 whitespace-pre-line">{service.additionalInfo}</p>
                                            </div>
                                        )}

                                        {service.faq && service.faq.length > 0 && (
                                            <div className="mt-8 pt-6 border-t">
                                                <h3 className="text-lg font-semibold mb-4">FAQ (Pertanyaan Umum)</h3>
                                                <div className="space-y-4">
                                                    {service.faq.map((item, i) => (
                                                        <div key={i} className="bg-gray-50 p-4 rounded-lg border hover:border-primary/30 transition-colors">
                                                            <p className="font-semibold text-gray-900 mb-2">Q: {item.question}</p>
                                                            <p className="text-gray-600 pl-4 border-l-2 border-gray-300">A: {item.answer}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </TabsContent>

                                    {/* Penyedia */}
                                    <TabsContent value="penyedia" className="space-y-6 animate-in fade-in-50">
                                        <div className="flex items-start gap-5 p-6 bg-gray-50 rounded-xl border">
                                            <Avatar className="h-20 w-20 border-4 border-white shadow-sm">
                                                <AvatarImage src={service.seller.profilePicture || ""} />
                                                <AvatarFallback className="text-xl bg-primary text-white">{getInitials(service.seller.fullName)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 pt-1">
                                                <h3 className="text-xl font-bold text-gray-900">{service.seller.fullName}</h3>
                                                <p className="text-sm text-gray-600 mb-3">
                                                    {service.seller.major} {service.seller.batch && `• Angkatan ${service.seller.batch}`}
                                                </p>
                                                <div className="flex gap-3">
                                                    <Link href={`/profile/${service.seller.id}`} target="_blank">
                                                        <Button variant="outline" size="sm" className="h-8">
                                                            Lihat Profil Lengkap
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="text-center p-5 bg-white border rounded-xl shadow-sm">
                                                <p className="text-3xl font-bold text-primary mb-1">{service.seller.totalOrdersCompleted || 0}</p>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Order</p>
                                            </div>
                                            <div className="text-center p-5 bg-white border rounded-xl shadow-sm">
                                                <p className="text-3xl font-bold text-primary mb-1">{service.seller.avgRating ? Number(service.seller.avgRating).toFixed(1) : 'New'}</p>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Rating</p>
                                            </div>
                                            <div className="text-center p-5 bg-white border rounded-xl shadow-sm">
                                                <p className="text-3xl font-bold text-primary mb-1">{service.seller.totalReviews || 0}</p>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ulasan</p>
                                            </div>
                                        </div>

                                        {service.seller.bio && (
                                            <div className="bg-white p-6 border rounded-xl">
                                                <h4 className="font-semibold mb-3 text-gray-900">Tentang Penyedia</h4>
                                                <p className="text-gray-600 leading-relaxed text-sm">{service.seller.bio}</p>
                                            </div>
                                        )}
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN: Sticky Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="sticky top-6">

                            {/* Decision Panel */}
                            <Card className="border-2 border-primary shadow-lg overflow-hidden relative">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary" />
                                <CardHeader className="bg-primary/5 pb-4">
                                    <CardTitle className="text-primary text-center">Keputusan Admin</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-6">
                                    <div className="text-center">
                                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Harga Layanan</p>
                                        <div className="text-3xl font-bold text-gray-900 bg-gray-50 py-3 rounded-lg border border-gray-100">
                                            {getPriceDisplay(service)}
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-2">
                                        <div className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded-lg">
                                            <span className="text-gray-500 flex items-center gap-2"><TbClock /> Pengerjaan</span>
                                            <span className="font-semibold text-gray-900">{service.deliveryTime} Hari</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded-lg">
                                            <span className="text-gray-500 flex items-center gap-2"><TbRefresh /> Revisi</span>
                                            <span className="font-semibold text-gray-900">{service.revisions > 0 ? `${service.revisions}x` : 'Tidak ada'}</span>
                                        </div>
                                        {service.minimumOrder && (
                                            <div className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded-lg">
                                                <span className="text-gray-500 flex items-center gap-2"><TbCheck /> Min. Order</span>
                                                <span className="font-semibold text-gray-900">{service.minimumOrder}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 pt-4">
                                        <Button
                                            variant="destructive"
                                            className="w-full h-12 shadow-sm hover:shadow-md transition-all"
                                            onClick={handleReject}
                                        >
                                            Tolak
                                        </Button>
                                        <Button
                                            className="w-full bg-green-600 hover:bg-green-700 h-12 shadow-sm hover:shadow-md transition-all"
                                            onClick={handleApprove}
                                        >
                                            Setujui
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Guidelines */}
                            <div className="mt-6 bg-white p-5 rounded-xl border shadow-sm">
                                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2 text-gray-900">
                                    <TbShield className="text-green-600" /> Panduan Review
                                </h4>
                                <ul className="text-xs space-y-2 text-gray-600 list-disc pl-4">
                                    <li>Pastikan judul dan deskripsi jelas & tidak menyesatkan.</li>
                                    <li>Gambar harus relevan dan tidak melanggar hak cipta.</li>
                                    <li>Harga harus masuk akal untuk layanan yang ditawarkan.</li>
                                    <li>Cek kelengkapan "Yang Didapat" dan "Persyaratan".</li>
                                </ul>
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </AdminLayout>
    );
}
