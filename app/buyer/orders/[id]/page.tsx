"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import BuyerLayout from "@/components/layouts/BuyerLayout";
import PaymentButton from "@/components/orders/PaymentButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Package,
  CheckCircle,
  Sparkles,
  FileText,
  Star,
  Shield,
  Download,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  Loader2,
  X,
  Ban,
  MessageSquareWarning,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { uploadBuyerOrderPhoto } from "@/lib/upload";

const BuyerOrderDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");

  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [revisionNote, setRevisionNote] = useState("");
  const [revisionAttachments, setRevisionAttachments] = useState<string[]>([]);
  const [revisionLoading, setRevisionLoading] = useState(false);
  const [revisionUploading, setRevisionUploading] = useState(false);
  const [revisionError, setRevisionError] = useState("");
  const revisionFileInputRef = useRef<HTMLInputElement>(null);

  // States for Cancellation
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancellationLoading, setCancellationLoading] = useState(false);

  // States for Complaint (Dispute)
  const [showComplaintDialog, setShowComplaintDialog] = useState(false);
  const [complaintReason, setComplaintReason] = useState("");
  const [complaintLoading, setComplaintLoading] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`/api/orders/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setOrder(data.data);
      }
    } catch (error) {
      console.error("Error fetching order:", error);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/auth/login");
      } else {
        fetchOrder();
      }
    }
  }, [authLoading, isAuthenticated, fetchOrder, router]);

  const handleCompleteOrder = async () => {
    if (rating === 0) return alert("Mohon berikan rating");
    try {
      const token = localStorage.getItem("access_token");
      await fetch(`/api/orders/${order?.id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (review) {
        await fetch(`/api/reviews/order/${order?.id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ rating, comment: review }),
        });
      }
      alert("Pesanan selesai! Terima kasih.");
      setShowCompleteDialog(false);
      fetchOrder();
    } catch (error) {
      console.error("Error:", error);
      alert("Gagal menyelesaikan pesanan");
    }
  };

  const handleRevisionFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    if (revisionAttachments.length + files.length > 5) {
      setRevisionError("Maksimal 5 file");
      return;
    }

    setRevisionUploading(true);
    setRevisionError("");

    try {
      const orderName = `order-${order?.id || Date.now()}`;
      const uploadPromises = Array.from(files).map((file) =>
        uploadBuyerOrderPhoto(file, user.fullName, orderName, user.nim)
      );

      const results = await Promise.all(uploadPromises);
      const newUrls = results.map((result) => result.data.url);
      setRevisionAttachments((prev) => [...prev, ...newUrls]);
    } catch (err: any) {
      setRevisionError(err.message || "Gagal mengupload file");
    } finally {
      setRevisionUploading(false);
      if (revisionFileInputRef.current) {
        revisionFileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveRevisionAttachment = (index: number) => {
    setRevisionAttachments(revisionAttachments.filter((_, i) => i !== index));
  };

  const handleRequestRevision = async () => {
    if (revisionNote.length < 20) {
      setRevisionError("Deskripsi revisi minimal 20 karakter.");
      return;
    }

    if (order.revisionCount >= order.maxRevisions) {
      setRevisionError("Batas revisi (" + order.maxRevisions + "x) telah tercapai.");
      return;
    }

    setRevisionLoading(true);
    setRevisionError("");

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`/api/orders/${order?.id}/revision`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          revisionNote,
          attachments: revisionAttachments,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(data.message || "Permintaan revisi berhasil dikirim.");
        setShowRevisionDialog(false);
        setRevisionNote("");
        setRevisionAttachments([]);
        fetchOrder();
      } else {
        setRevisionError(data.error || "Gagal meminta revisi. Cek jatah revisi Anda.");
      }
    } catch (error) {
      setRevisionError("Terjadi kesalahan jaringan.");
    } finally {
      setRevisionLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (cancellationReason.length < 10) {
      alert("Alasan pembatalan minimal 10 karakter");
      return;
    }

    setCancellationLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`/api/orders/${order?.id}/cancel/buyer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: cancellationReason }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setShowCancelDialog(false);
        fetchOrder();
      } else {
        alert(data.error || "Gagal membatalkan pesanan");
      }
    } catch (err) {
      alert("Terjadi kesalahan sistem");
    } finally {
      setCancellationLoading(false);
    }
  };

  const handleComplain = async () => {
    if (complaintReason.length < 50) {
      alert("Alasan komplain minimal 50 karakter");
      return;
    }

    setComplaintLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`/api/disputes/order/${order?.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: complaintReason }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Komplain berhasil diajukan. Admin akan meninjau pesanan ini.");
        setShowComplaintDialog(false);
        fetchOrder();
      } else {
        alert(data.error || "Gagal mengajukan komplain");
      }
    } catch (err) {
      alert("Terjadi kesalahan sistem");
    } finally {
      setComplaintLoading(false);
    }
  };

  if (loading || authLoading)
    return (
      <BuyerLayout>
        <div className="p-10 text-center">Loading...</div>
      </BuyerLayout>
    );
  if (!order)
    return (
      <BuyerLayout>
        <div className="p-10 text-center">Order not found</div>
      </BuyerLayout>
    );

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);

  const getStatusProgress = (status: string) => {
    const map: Record<string, number> = {
      DRAFT: 10,
      WAITING_PAYMENT: 20,
      PAID_ESCROW: 40,
      IN_PROGRESS: 55,
      REVISION: 70,
      DELIVERED: 85,
      COMPLETED: 100,
      CANCELLED: 0,
    };
    return map[status] || 0;
  };

  const isRevisionStage = order.status === 'REVISION';
  const hasRevisionHistory = order.revisionCount > 0;
  const isAfterRevision = ["DELIVERED", "COMPLETED"].includes(order.status);

  const baseStages = [
    {
      id: 1,
      label: "Pesanan Dibuat",
      date: order.createdAt,
      completed: true,
      icon: Package,
    },
    {
      id: 2,
      label: "Pembayaran",
      date: order.paidAt,
      completed: !!order.paidAt,
      icon: Shield,
    },
    {
      id: 3,
      label: "Dikerjakan",
      date: undefined,
      completed: ["IN_PROGRESS", "REVISION", "DELIVERED", "COMPLETED"].includes(
        order.status
      ),
      icon: Sparkles,
    },
  ];

  const revisionStage = hasRevisionHistory ? [{
    id: 3.5,
    label: `Revisi Diminta (${order.revisionCount} dari ${order.maxRevisions}x)`,
    date: isRevisionStage ? order.deliveredAt : undefined,
    completed: isRevisionStage || isAfterRevision,
    icon: RefreshCw,
  }] : [];

  const finalStages = [
    ...baseStages,
    ...revisionStage,
    {
      id: 4,
      label: "Review Hasil",
      date: order.deliveredAt,
      completed: ["DELIVERED", "COMPLETED"].includes(order.status),
      icon: FileText,
    },
    {
      id: 5,
      label: "Selesai",
      date: order.completedAt,
      completed: order.status === "COMPLETED",
      icon: Star,
    },
  ];

  const trackingStages = finalStages;
  const activeStageIndex = trackingStages.filter((s) => s.completed).length - 1;

  const maxRevisionsReached = order.revisionCount >= order.maxRevisions;

  // LOGIKA BARU: Tentukan apakah aksi pembayaran harus ditampilkan
  const showPaymentActions = ["DRAFT", "WAITING_PAYMENT"].includes(
    order.status
  );

  return (
    <BuyerLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Button
              variant="ghost"
              className="pl-0 mb-1 hover:bg-transparent hover:text-primary"
              onClick={() => router.push("/buyer/orders")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Pesanan
            </Button>
            <h1 className="text-3xl font-bold font-display text-foreground">
              #{order.id.substring(0, 8).toUpperCase()}
            </h1>
            <p className="text-muted-foreground">
              Layanan: {order.service.title}
            </p>
          </div>
          <Badge
            variant="outline"
            className="text-base py-1 px-4 bg-primary/10 text-primary border-primary/20"
          >
            {order.status.replace("_", " ")}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" /> Tracking Pesanan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-8">
                  <div className="flex justify-between text-sm mb-2 text-muted-foreground">
                    <span>Progress</span>
                    <span>{getStatusProgress(order.status)}%</span>
                  </div>
                  <Progress
                    value={getStatusProgress(order.status)}
                    className="h-2"
                  />
                </div>
                <div className="space-y-6 relative pl-2">
                  <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-muted -z-10" />
                  {trackingStages.map((stage, idx) => {
                    const Icon = stage.icon;
                    const isCompleted = stage.completed;

                    const statusClass = isCompleted
                      ? "border-primary text-primary"
                      : "border-muted text-muted-foreground";

                    return (
                      <div key={stage.id} className="flex gap-4 items-start">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 bg-background shrink-0 ${statusClass}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="pt-2">
                          <h4
                            className={`font-medium ${isCompleted
                              ? "text-foreground"
                              : "text-muted-foreground"
                              }`}
                          >
                            {stage.label}
                          </h4>
                          {stage.date && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(stage.date).toLocaleDateString("id-ID")}
                            </p>
                          )}
                          {stage.id === 3.5 && order.status === 'REVISION' && (
                            <p className="text-xs text-orange-600 font-medium">
                              Menunggu Penyedia Jasa Menyerahkan Hasil Revisi
                            </p>
                          )}
                          {stage.id === 3.5 && order.status === 'DELIVERED' && (
                            <p className="text-xs text-green-600 font-medium">
                              Hasil Revisi Dikirim Ulang
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detail Jasa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="relative h-32 w-full sm:w-40 rounded-lg overflow-hidden bg-muted border">
                    {order.service.images?.[0] && (
                      <Image
                        src={order.service.images[0]}
                        alt={order.service.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 160px"
                      />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="text-lg font-semibold">
                      {order.service.title}
                    </h3>
                    <Badge variant="secondary">{order.service.category}</Badge>
                    <div className="bg-muted/30 p-4 rounded-lg text-sm text-muted-foreground mt-2">
                      <p className="font-medium text-foreground mb-1">
                        Requirements:
                      </p>
                      {order.requirements}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>Status & Aksi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* STATUS BADGES & INFO */}
                {order.status === "PAID_ESCROW" && (
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm text-blue-900 mb-2">
                    <p className="font-medium flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      Menunggu Konfirmasi Seller
                    </p>
                    <p className="text-xs mt-1 text-blue-800">
                      Seller belum memulai pekerjaan. Anda dapat membatalkan pesanan.
                    </p>
                  </div>
                )}

                {order.dispute && (
                  <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-sm text-red-900 mb-2">
                    <p className="font-medium flex items-center gap-2">
                      <Shield className="h-4 w-4 text-red-600" />
                      Dalam Sengketa
                    </p>
                    <p className="text-xs mt-1 text-red-800">
                      Pesanan ini sedang ditinjau oleh Admin karena adanya komplain. Auto-complete dimatikan.
                    </p>
                  </div>
                )}
                {showPaymentActions && (
                  <>
                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs text-amber-900 flex gap-2">
                      <AlertCircle className="shrink-0 w-4 h-4 mt-0.5" />
                      <p>
                        Dana Anda akan disimpan dengan aman dalam rekening
                        escrow dan akan dilepaskan kepada penyedia setelah
                        pekerjaan selesai.
                      </p>
                    </div>
                    <PaymentButton orderId={order.id} onSuccess={fetchOrder} />
                  </>
                )}

                {/* CANCEL BUTTON FOR PAID_ESCROW (Before Approval) */}
                {order.status === "PAID_ESCROW" && (
                  <Button
                    variant="outline"
                    className="w-full text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => setShowCancelDialog(true)}
                  >
                    <Ban className="mr-2 h-4 w-4" /> Batalkan Pesanan
                  </Button>
                )}

                {/* CANCEL BUTTON FOR DRAFT/WAITING (Optional improvement) */}
                {(order.status === "DRAFT" || order.status === "WAITING_PAYMENT") && (
                  <Button
                    variant="ghost"
                    className="w-full text-red-500 hover:text-red-700 hover:bg-red-50 mt-2 h-8 text-xs"
                    onClick={() => setShowCancelDialog(true)}
                  >
                    Batalkan Pesanan
                  </Button>
                )}
                {/* END LOGIKA PEMBAYARAN */}

                {order.status === "DELIVERED" && (
                  <div className="space-y-2">
                    <Button
                      onClick={() => setShowCompleteDialog(true)}
                      className="w-full"
                    >
                      Terima Pesanan & Selesaikan
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowRevisionDialog(true)}
                      className="w-full text-orange-600 border-orange-300 hover:bg-orange-50"
                      disabled={maxRevisionsReached}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" /> Minta Revisi
                      {order.revisionCount >= 0 && (
                        <Badge
                          variant={maxRevisionsReached ? "destructive" : "secondary"}
                          className={`ml-2 ${maxRevisionsReached ? "bg-destructive/10 text-destructive border-destructive" : "bg-orange-100 text-orange-700 border-orange-200"}`}
                        >
                          {order.revisionCount} / {order.maxRevisions}
                        </Badge>
                      )}
                    </Button>
                    {maxRevisionsReached && (
                      <p className="text-xs text-center text-destructive">
                        Batas revisi sudah tercapai. Pilihan lain adalah Buka Sengketa.
                      </p>
                    )}
                  </div>
                )}

                {order.status === "REVISION" && (
                  <div className="text-sm text-muted-foreground text-center bg-orange-50/50 p-3 rounded border border-orange-200">
                    Permintaan revisi **ke-{order.revisionCount}** sedang dikerjakan oleh Seller.
                    ({order.maxRevisions - order.revisionCount}x tersisa)
                  </div>
                )}

                {order.status === "IN_PROGRESS" && (
                  <div className="text-sm text-muted-foreground text-center bg-muted/50 p-3 rounded">
                    Penyedia sedang mengerjakan pesanan Anda.
                  </div>
                )}

                {/* COMPLAINT BUTTON - Available during work/delivery if no dispute active */}
                {(["IN_PROGRESS", "REVISION", "DELIVERED"].includes(order.status)) && !order.dispute && (
                  <div className="pt-2">
                    <Button
                      variant="ghost"
                      className="w-full text-muted-foreground hover:text-destructive text-xs border border-transparent hover:border-destructive/20"
                      onClick={() => setShowComplaintDialog(true)}
                    >
                      <MessageSquareWarning className="h-3 w-3 mr-1.5" />
                      Ajukan Komplain / Sengketa
                    </Button>
                  </div>
                )}

                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-muted-foreground">Total Biaya</span>
                  <span className="font-bold text-primary">
                    {formatPrice(order.price)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={order.service.seller.profilePicture} />
                  <AvatarFallback>
                    {order.service.seller.fullName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs text-muted-foreground">Penyedia Jasa</p>
                  <p className="font-medium">{order.service.seller.fullName}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Komunikasi & File</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="files" className="w-full">
                  <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="files">File</TabsTrigger>
                    <TabsTrigger value="chat">Chat</TabsTrigger>
                  </TabsList>
                  <TabsContent value="files" className="mt-4 space-y-3">
                    {order.deliveryFiles?.length > 0 ? (
                      order.deliveryFiles.map((file: string, idx: number) => (
                        <div
                          key={idx}
                          className="p-3 bg-muted/30 border rounded-lg flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                            <span className="text-sm truncate">
                              File Hasil {idx + 1}
                            </span>
                          </div>
                          <a
                            href={file}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </a>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        Belum ada file
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="chat" className="mt-4">
                    <div className="bg-muted/30 rounded-lg p-4 text-center text-sm text-muted-foreground min-h-[150px] flex flex-col items-center justify-center">
                      <p>Chat akan segera hadir.</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>

        <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Konfirmasi Penyelesaian</DialogTitle>
              <DialogDescription>
                Konfirmasi bahwa pekerjaan telah selesai dan dana dapat
                diteruskan.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <p className="text-sm mb-2 font-medium">Rating</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setRating(star)}>
                      <Star
                        className={`h-8 w-8 ${star <= rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                          }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <Textarea
                placeholder="Ulasan Anda..."
                value={review}
                onChange={(e) => setReview(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCompleteDialog(false)}
              >
                Batal
              </Button>
              <Button onClick={handleCompleteOrder}>Selesai</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Minta Revisi ({order.revisionCount} dari {order.maxRevisions}x)</DialogTitle>
              <DialogDescription>
                Jelaskan secara detail apa yang perlu diubah. Jatah revisi Anda akan berkurang.
                {maxRevisionsReached && (
                  <p className="text-sm text-destructive mt-2">
                    **PERINGATAN:** Anda telah mencapai batas {order.maxRevisions}x revisi. Jika Anda tetap tidak puas, langkah selanjutnya adalah membuka sengketa.
                  </p>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <form onSubmit={(e) => { e.preventDefault(); handleRequestRevision(); }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="revisionNote">
                    Deskripsi Revisi <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="revisionNote"
                    placeholder="Contoh: Warna logo perlu diganti menjadi #00A65A dan tata letak teks diubah."
                    value={revisionNote}
                    onChange={(e) => {
                      setRevisionNote(e.target.value);
                      setRevisionError("");
                    }}
                    rows={5}
                    required
                  />
                  {revisionNote.length < 20 && (
                    <p className="text-xs text-muted-foreground">Minimal 20 karakter ({revisionNote.length}/20)</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Lampiran Pendukung (Max 5)</Label>
                  <div className="flex gap-2">
                    <Input
                      ref={revisionFileInputRef}
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handleRevisionFileSelect}
                      disabled={revisionAttachments.length >= 5 || revisionUploading}
                      className="flex-1"
                    />
                    {revisionUploading && (
                      <div className="flex items-center text-sm text-muted-foreground px-2">
                        <Loader2 className="animate-spin mr-2 h-4 w-4" />
                        Mengupload...
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 mt-2">
                    {revisionAttachments.map((url, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded"
                      >
                        <span className="truncate">{url}</span>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          type="button"
                          onClick={() => handleRemoveRevisionAttachment(index)}
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {revisionError && (
                  <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm flex items-center">
                    <AlertCircle className="inline h-4 w-4 mr-2" />
                    {revisionError}
                  </div>
                )}
              </form>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowRevisionDialog(false)}
                disabled={revisionLoading}
              >
                Batal
              </Button>
              <Button
                onClick={handleRequestRevision}
                disabled={revisionLoading || maxRevisionsReached || revisionNote.length < 20}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {revisionLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengirim...</>
                ) : (
                  "Kirim Permintaan Revisi"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Batalkan Pesanan</DialogTitle>
              <DialogDescription>
                Apakah Anda yakin ingin membatalkan pesanan ini?
                {order.isPaid && " Dana akan dikembalikan ke saldo dompet Anda."}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label className="mb-2 block">Alasan Pembatalan</Label>
              <Textarea
                placeholder="Contoh: Saya berubah pikiran, Seller tidak merespon..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCancelDialog(false)}>Kembali</Button>
              <Button
                variant="destructive"
                onClick={handleCancelOrder}
                disabled={cancellationLoading || cancellationReason.length < 10}
              >
                {cancellationLoading ? "Memproses..." : "Batalkan Pesanan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* COMPLAINT DIALOG */}
        <Dialog open={showComplaintDialog} onOpenChange={setShowComplaintDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajukan Komplain</DialogTitle>
              <DialogDescription>
                Ajukan komplain jika hasil tidak sesuai atau ada masalah serius.
                Pesanan ini akan ditahan dari penyelesaian otomatis sampai Admin menyelesaikannya.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label className="mb-2 block">Detail Masalah</Label>
              <Textarea
                placeholder="Jelaskan masalah Anda secara detail..."
                value={complaintReason}
                onChange={(e) => setComplaintReason(e.target.value)}
                rows={5}
              />
              <p className="text-xs text-muted-foreground mt-2">Minimal 50 karakter.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowComplaintDialog(false)}>Batal</Button>
              <Button
                onClick={handleComplain}
                className="bg-red-600 hover:bg-red-700"
                disabled={complaintLoading || complaintReason.length < 20}
              >
                {complaintLoading ? "Mengirim..." : "Kirim Komplain"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </BuyerLayout>
  );
};

export default BuyerOrderDetailPage;