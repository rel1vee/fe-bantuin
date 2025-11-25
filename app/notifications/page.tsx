'use client'; 

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

const getIcon = (type: Notification["type"]) => {
  const iconProps = { className: "h-5 w-5" }; // Diperbesar untuk tampilan halaman

  switch (type) {
    case "ORDER":
      return <ShoppingCart {...iconProps} className={cn(iconProps.className, "text-blue-600")} />;
    case "DISPUTE":
      return <AlertCircle {...iconProps} className={cn(iconProps.className, "text-red-600")} />;
    case "CHAT":
      return <MessageSquare {...iconProps} className={cn(iconProps.className, "text-green-600")} />;
    case "WALLET":
      return <Wallet {...iconProps} className={cn(iconProps.className, "text-yellow-600")} />;
    case "REVIEW":
      return <Star {...iconProps} className={cn(iconProps.className, "text-amber-500")} />;
    default:
      return <Bell {...iconProps} className={cn(iconProps.className, "text-gray-500")} />;
  }
};

// Komponen Item Notifikasi yang diadaptasi untuk Tampilan Halaman Penuh
const PageNotificationItem: React.FC<{ notification: Notification }> = ({
  notification,
}) => {
  const markAsRead = useMarkAsRead(notification.id);
  
  // Menggunakan styling yang lebih menonjol untuk halaman penuh
  const bgColor = notification.isRead
    ? "bg-white border hover:bg-gray-50"
    : "bg-secondary/10 border border-primary/20 hover:bg-secondary/20";
  const textColor = notification.isRead ? "text-gray-700" : "text-primary font-medium";

  const handleClick = async () => {
    if (!notification.isRead) {
      await markAsRead();
    }
  };

  const content = (
    <div className={cn("p-4 rounded-lg shadow-sm flex items-start gap-4 transition-colors", bgColor)}>
      <div className="flex-shrink-0 mt-1">
        {getIcon(notification.type)}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={cn("text-base break-words leading-snug", textColor)}>
          {notification.content}
        </p>
        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
              locale: idLocale,
            })}
          </span>
        </div>
      </div>
      
      {notification.link && (
        <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto mt-1 flex-shrink-0" />
      )}

      {!notification.isRead && (
        <div className="size-2 rounded-full bg-red-500 shrink-0 mt-2" title="Belum Dibaca"></div>
      )}
    </div>
  );

  return (
    <Link 
      href={notification.link || "#"} 
      passHref 
      onClick={handleClick} 
      className="block"
    >
      {content}
    </Link>
  );
};

// Komponen Utama Halaman Notifikasi (Pengganti NotificationDropdown)
export default function NotificationsPage() {
  const { notifications, isLoading, isError } = useNotifications();
  const { unreadCount, isLoadingCount } = useUnreadCount();
  const { markAllAsRead, isMutating } = useMarkAllAsRead();

  const handleMarkAll = async () => {
    await markAllAsRead();
  };

  const hasNotifications = notifications && notifications.length > 0;
  
  // Pisahkan notifikasi
  const unreadNotifications = notifications?.filter(n => !n.isRead) || [];
  const readNotifications = notifications?.filter(n => n.isRead) || [];

  // --- Render Status Loading/Error ---
  if (isLoading || isLoadingCount) {
    return (
      <div className="flex justify-center items-center h-screen-minus-header"> {/* Asumsi kelas h-screen-minus-header */}
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-3 text-lg text-gray-600">Memuat notifikasi...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 sm:p-8 text-center bg-red-50 border border-red-200 rounded-lg max-w-xl mx-auto mt-10">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
        <p className="text-red-700 font-medium">Gagal memuat data notifikasi. Silakan coba refresh.</p>
      </div>
    );
  }

  // --- Render Halaman Notifikasi Penuh ---
  return (
    // Gunakan padding responsif dan lebar maksimum yang lebih ketat untuk mobile
    <div className="max-w-xl mx-auto p-4 sm:p-6 lg:max-w-3xl"> 
      
      {/* Header Halaman Notifikasi */}
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center">
          <Bell className="w-6 h-6 sm:w-7 sm:h-7 mr-2 text-primary" />
          Notifikasi
          {/* Jumlah Belum Dibaca */}
          <Badge 
            variant="destructive" 
            className="ml-2 text-sm sm:text-base font-bold px-2 py-1"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        </h1>
        
        {/* Tombol Baca Semua */}
        {hasNotifications && (
          <Button 
            onClick={handleMarkAll}
            disabled={isMutating || unreadCount === 0}
            className="text-xs sm:text-sm h-8"
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

      {/* Konten Notifikasi */}
      {!hasNotifications && (
        <div className="text-center p-10 sm:p-20 border-2 border-dashed rounded-xl bg-gray-50 mt-10">
          <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-green-500 mx-auto mb-4" />
          <p className="text-lg sm:text-xl text-gray-600 font-semibold">
            Semua beres! Tidak ada notifikasi saat ini.
          </p>
        </div>
      )}

      {/* Daftar Notifikasi */}
      {hasNotifications && (
        <section className="space-y-6 mt-6">
          {/* Bagian Belum Dibaca */}
          {unreadNotifications.length > 0 && (
            <div>
              <h2 className="text-lg sm:text-xl font-bold mb-3 text-primary">Baru ({unreadNotifications.length})</h2>
              <div className="space-y-3">
                {unreadNotifications.map(notif => (
                  // Item notifikasi untuk halaman penuh
                  <PageNotificationItem key={notif.id} notification={notif} />
                ))}
              </div>
            </div>
          )}

          {/* Bagian Sudah Dibaca */}
          {readNotifications.length > 0 && (
            <div className={unreadNotifications.length > 0 ? "pt-6 border-t mt-6" : ""}>
              <h2 className="text-lg sm:text-xl font-bold mb-3 text-gray-500">Sudah Dibaca ({readNotifications.length})</h2>
              <div className="space-y-3 opacity-80"> {/* Sedikit opacity untuk yang sudah dibaca */}
                {readNotifications.map(notif => (
                  <PageNotificationItem key={notif.id} notification={notif} />
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}