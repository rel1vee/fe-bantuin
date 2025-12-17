"use client";

import * as React from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  Bell,
  Loader2,
  MailOpen,
  AlertCircle,
  ShoppingCart,
  MessageSquare,
  Wallet,
  Star,
  CheckCircle,
  Clock,
  ExternalLink,
  ChevronLeft,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useNotifications,
  useUnreadCount,
  useMarkAllAsRead,
  useMarkAsRead,
} from "@/lib/hooks/useNotifications";
import type { Notification } from "@/app/types/notification";
import useSWR from "swr";

interface ActivityLog {
  action: string;
  status: string;
  details: string;
  device?: string;
  timestamp: string;
}

const getIcon = (type: Notification["type"]) => {
  const iconProps = { className: "h-5 w-5" };

  switch (type) {
    case "ORDER":
      return (
        <ShoppingCart
          {...iconProps}
          className={cn(iconProps.className, "text-blue-600")}
        />
      );
    case "DISPUTE":
      return (
        <AlertCircle
          {...iconProps}
          className={cn(iconProps.className, "text-red-600")}
        />
      );
    case "CHAT":
      return (
        <MessageSquare
          {...iconProps}
          className={cn(iconProps.className, "text-green-600")}
        />
      );
    case "WALLET":
      return (
        <Wallet
          {...iconProps}
          className={cn(iconProps.className, "text-yellow-600")}
        />
      );
    case "REVIEW":
      return (
        <Star
          {...iconProps}
          className={cn(iconProps.className, "text-amber-500")}
        />
      );
    default:
      return (
        <Bell
          {...iconProps}
          className={cn(iconProps.className, "text-gray-500")}
        />
      );
  }
};

// Komponen Item Notifikasi yang diadaptasi untuk Tampilan Halaman Penuh
const PageNotificationItem: React.FC<{ notification: Notification }> = ({
  notification,
}) => {
  const markAsRead = useMarkAsRead(notification.id);

  const bgColor = notification.isRead
    ? "bg-white border hover:bg-gray-50"
    : "bg-secondary/10 border border-primary/20 hover:bg-secondary/20";
  
  const textColor = notification.isRead
    ? "text-gray-700"
    : "text-primary font-medium";

  const handleClick = async () => {
    if (!notification.isRead) {
      await markAsRead();
    }
  };

  return (
    <Link
      href={notification.link || "#"}
      passHref
      onClick={handleClick}
      className="block w-full" // Pastikan link mengambil lebar penuh
    >
      <div
        className={cn(
          "p-4 rounded-lg shadow-sm flex items-start gap-4 transition-colors w-full", // Tambahkan w-full
          bgColor
        )}
      >
        <div className="shrink-0 mt-1">{getIcon(notification.type)}</div>

        {/* PERBAIKAN UTAMA DI SINI */}
        <div className="flex-1 min-w-0"> {/* min-w-0 mencegah flex item overflow */}
          <p 
            className={cn(
              "text-base leading-snug break-words whitespace-pre-wrap", // break-words: fix overflow, whitespace-pre-wrap: jaga spasi/enter
              textColor,
              // OPSIONAL: Jika ingin notif yg SUDAH DIBACA dibatasi barisnya agar rapi, uncomment baris bawah:
              // notification.isRead && "line-clamp-3 text-gray-500" 
            )}
          >
            {notification.content}
          </p>
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground flex-wrap">
            <Clock className="h-3 w-3 shrink-0" />
            <span className="truncate"> {/* Truncate tanggal jika layar sangat kecil */}
              {formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
                locale: idLocale,
              })}
            </span>
          </div>
        </div>

        {notification.link && (
          <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto mt-1 shrink-0" />
        )}

        {!notification.isRead && (
          <div
            className="size-2 rounded-full bg-red-500 shrink-0 mt-2"
            title="Belum Dibaca"
          ></div>
        )}
      </div>
    </Link>
  );
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function NotificationsPage() {
  const { notifications, isLoading, isError } = useNotifications();
  const { unreadCount, isLoadingCount } = useUnreadCount();
  const { markAllAsRead, isMutating } = useMarkAllAsRead();

  // === RIWAYAT AKTIVITAS USER ===
  const { data: activityData } = useSWR("/api/activity", fetcher, {
    refreshInterval: 30000,
  });
  const activities: ActivityLog[] = activityData?.data || [];

  const handleMarkAll = async () => {
    await markAllAsRead();
  };

  const hasNotifications = notifications && notifications.length > 0;
  const unreadNotifications = notifications?.filter((n) => !n.isRead) || [];
  const readNotifications = notifications?.filter((n) => n.isRead) || [];

  if (isLoading || isLoadingCount) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-3 text-lg text-gray-600">Memuat notifikasi...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 sm:p-8 text-center bg-red-50 border border-red-200 rounded-lg max-w-xl mx-auto mt-10">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
        <p className="text-red-700 font-medium">
          Gagal memuat data notifikasi. Silakan coba refresh.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6 lg:max-w-3xl w-full"> {/* Tambah w-full */}
      <div className="mb-2">
        <Button
          variant="ghost"
          className="pl-0 text-muted-foreground hover:text-primary"
          asChild
        >
          <Link href="/" className="flex items-center gap-2">
            <ChevronLeft className="h-4 w-4" />
            Kembali
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-4 gap-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center">
          <Bell className="w-6 h-6 sm:w-7 sm:h-7 mr-2 text-primary shrink-0" />
          Notifikasi
          <Badge
            variant="destructive"
            className="ml-2 text-sm sm:text-base font-bold px-2 py-1"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        </h1>

        {hasNotifications && (
          <Button
            onClick={handleMarkAll}
            disabled={isMutating || unreadCount === 0}
            className="text-xs sm:text-sm h-8 w-full sm:w-auto"
          >
            {isMutating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <MailOpen className="mr-2 h-4 w-4" />
            )}
            Baca Semua
          </Button>
        )}
      </div>

      {!hasNotifications && (
        <div className="text-center p-10 sm:p-20 border-2 border-dashed rounded-xl mt-10">
          <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-green-500 mx-auto mb-4" />
          <p className="text-lg sm:text-xl text-gray-600 font-semibold">
            Semua beres! Tidak ada notifikasi saat ini.
          </p>
        </div>
      )}

      {hasNotifications && (
        <section className="space-y-6 mt-6">
          {unreadNotifications.length > 0 && (
            <div>
              <h2 className="text-lg sm:text-xl font-bold mb-3 text-primary">
                Baru ({unreadNotifications.length})
              </h2>
              <div className="space-y-3">
                {unreadNotifications.map((notif) => (
                  <PageNotificationItem key={notif.id} notification={notif} />
                ))}
              </div>
            </div>
          )}

          {readNotifications.length > 0 && (
            <div
              className={
                unreadNotifications.length > 0 ? "pt-6 border-t mt-6" : ""
              }
            >
              <h2 className="text-lg sm:text-xl font-bold mb-3 text-gray-500">
                Sudah Dibaca ({readNotifications.length})
              </h2>
              <div className="space-y-3 opacity-90"> {/* Opacity dinaikkan sedikit agar lebih terbaca */}
                {readNotifications.map((notif) => (
                  <PageNotificationItem key={notif.id} notification={notif} />
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <section className="mt-12">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shrink-0">
            <ArrowRight className="w-6 h-6 text-white" />
          </div>
          Riwayat Aktivitas
        </h2>

        {activities.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Belum ada aktivitas</p>
        ) : (
          <div className="space-y-4">
            {activities.map((log: ActivityLog, index: number) => (
              <div
                key={index}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow transition flex gap-4 items-start"
              >
                <div className="mt-1 shrink-0">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <ArrowRight className="w-6 h-6 text-white" />
                  </div>
                </div>
                {/* Tambahan min-w-0 untuk aktivitas juga */}
                <div className="flex-1 min-w-0"> 
                  <p className="font-medium text-gray-900 capitalize break-words">
                    {log.action.replace(/_/g, " ")}
                  </p>
                  <p className="text-sm text-gray-600 mt-1 break-words">
                    {log.details}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {log.device || "Perangkat tidak diketahui"} •{" "}
                    {new Date(log.timestamp).toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}