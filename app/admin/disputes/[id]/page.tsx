"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, Link, XCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function AdminDisputeDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [dispute, setDispute] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [resolveType, setResolveType] = useState<'REFUND_TO_BUYER' | 'RELEASE_TO_SELLER' | null>(null);
    const [adminNotes, setAdminNotes] = useState("");
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchDisputeDetails();
    }, [id]);

    const fetchDisputeDetails = async () => {
        try {
            const token = localStorage.getItem("access_token");
            // Use generic get dispute detail endpoint (now accessible to Admin)
            const res = await fetch(`/api/disputes/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setDispute(data.data);
            } else {
                try {
                    // Fallback to Admin-specific service lookup if public fails?
                    // Actually, we fixed the public endpoint to allow admins.
                    console.error("Fetch failed", res.status);
                } catch (e) { }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async () => {
        if (!resolveType || adminNotes.length < 10) {
            toast.error("Mohon isi catatan admin minimal 10 karakter.");
            return;
        }

        setProcessing(true);
        try {
            const token = localStorage.getItem("access_token");
            // Use AdminController endpoint
            const res = await fetch(`/api/admin/disputes/${id}/resolve`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    resolution: resolveType,
                    adminNotes: adminNotes,
                }),
            });

            const data = await res.json();
            if (data.success) {
                toast.success("Sengketa berhasil diselesaikan.");
                setResolveType(null);
                fetchDisputeDetails();
                router.refresh();
            } else {
                toast.error(data.message || "Gagal menyelesaikan sengketa");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan sistem");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <AdminLayout><div className="p-8">Loading...</div></AdminLayout>;
    if (!dispute) return <AdminLayout><div className="p-8">Dispute not found</div></AdminLayout>;

    return (
        <AdminLayout>
            <div className="space-y-6 max-w-4xl mx-auto">
                <Button variant="ghost" onClick={() => router.push("/admin/disputes")} className="pl-0">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Daftar
                </Button>

                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold">Sengketa #{dispute.id.substring(0, 8)}</h1>
                        <p className="text-muted-foreground">Order #{dispute.orderId.substring(0, 8)}</p>
                    </div>
                    <Badge variant={dispute.status === 'OPEN' ? 'destructive' : 'outline'} className="text-lg">
                        {dispute.status}
                    </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Detail Masalah</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-muted-foreground">Pelapor</Label>
                                <div className="flex items-center gap-2 mt-1">
                                    {/* Try to show avatar if available */}
                                    <span className="font-medium">{dispute.openedBy?.fullName || "User"}</span>
                                    <Badge variant="outline">{dispute.openedBy?.role}</Badge>
                                </div>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Alasan Sengketa</Label>
                                <div className="bg-muted p-3 rounded-lg mt-1 text-sm whitespace-pre-wrap">
                                    {dispute.reason}
                                </div>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Tanggal Laporan</Label>
                                <p>{new Date(dispute.createdAt).toLocaleString()}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Detail Pesanan</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-muted-foreground">Judul Layanan</Label>
                                <p className="font-medium">{dispute.order?.service?.title || dispute.order?.title || "N/A"}</p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Harga</Label>
                                <p className="font-medium">Rp {Number(dispute.order?.price).toLocaleString()}</p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Status Order Saat Ini</Label>
                                <div className="mt-1">
                                    <Badge>{dispute.order?.status}</Badge>
                                </div>
                            </div>
                            <div className="pt-2">
                                <Link href={`/orders/${dispute.orderId}`} target="_blank">
                                    <Button variant="outline" size="sm">Lihat Order Asli</Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* MESSAGES SECTION (Using existing Dispute logic which includes messages) */}
                <Card>
                    <CardHeader>
                        <CardTitle>Pesan / Diskusi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {dispute.messages && dispute.messages.length > 0 ? (
                            <div className="space-y-4 max-h-[300px] overflow-y-auto p-2 border rounded">
                                {dispute.messages.map((msg: any) => (
                                    <div key={msg.id} className="bg-muted/50 p-3 rounded">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-semibold text-sm">{msg.sender?.fullName}</span>
                                            <span className="text-xs text-muted-foreground">{new Date(msg.createdAt).toLocaleString()}</span>
                                        </div>
                                        <p className="text-sm">{msg.content}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-sm">Belum ada pesan diskusi.</p>
                        )}
                    </CardContent>
                </Card>

                {dispute.status === 'OPEN' && (
                    <Card className="border-orange-200 bg-orange-50/30">
                        <CardHeader>
                            <CardTitle>Keputusan Admin</CardTitle>
                        </CardHeader>
                        <CardContent className="flex gap-4">
                            <Button
                                onClick={() => setResolveType('REFUND_TO_BUYER')}
                                className="flex-1 bg-red-600 hover:bg-red-700"
                            >
                                <XCircle className="mr-2 h-4 w-4" /> Refund ke Pembeli
                            </Button>
                            <Button
                                onClick={() => setResolveType('RELEASE_TO_SELLER')}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                                <CheckCircle className="mr-2 h-4 w-4" /> Release ke Penjual
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {dispute.status === 'RESOLVED' && (
                    <Card className="border-green-200 bg-green-50/30">
                        <CardHeader>
                            <CardTitle>Hasil Keputusan</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <p><span className="font-semibold">Keputusan:</span> {dispute.resolution}</p>
                            <p><span className="font-semibold">Catatan Admin:</span> {dispute.adminNotes}</p>
                            <p><span className="font-semibold">Diputuskan Oleh:</span> Admin</p>
                            <p><span className="font-semibold">Tanggal:</span> {new Date(dispute.resolvedAt).toLocaleString()}</p>
                        </CardContent>
                    </Card>
                )}

                <Dialog open={!!resolveType} onOpenChange={(open) => !open && setResolveType(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {resolveType === 'REFUND_TO_BUYER' ? 'Refund Dana ke Pembeli' : 'Release Dana ke Penjual'}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <p className="text-sm text-muted-foreground">
                                {resolveType === 'REFUND_TO_BUYER'
                                    ? "Tindakan ini akan membatalkan pesanan dan mengembalikan 100% dana dari Escrow ke Dompet Pembeli. Pastikan bukti mendukung klaim pembeli."
                                    : "Tindakan ini akan menyelesaikan pesanan dan meneruskan dana dari Escrow ke Dompet Penjual (setelah potongan fee). Pastikan pekerjaan penjual sudah sesuai."
                                }
                            </p>
                            <div className="space-y-2">
                                <Label>Catatan Keputusan (Wajib)</Label>
                                <Textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Jelaskan alasan keputusan Anda..."
                                    rows={4}
                                />
                                <p className="text-xs text-muted-foreground">Minimal 10 karakter.</p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setResolveType(null)}>Batal</Button>
                            <Button
                                onClick={handleResolve}
                                disabled={processing || adminNotes.length < 10}
                                className={resolveType === 'REFUND_TO_BUYER' ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                            >
                                {processing ? "Memproses..." : "Konfirmasi Keputusan"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </div>
        </AdminLayout>
    );
}
