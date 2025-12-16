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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useNotifications,
  useUnreadCount,
  useMarkAllAsRead,
  useMarkAsRead,
} from "@/lib/hooks/useNotifications";
import type { Notification } from "@/app/types/notification";
import { apiClient } from "@/lib/api-client";

// Helper untuk memilih ikon
const getIcon = (type: Notification["type"]) => {
  switch (type) {
    case "ORDER":
      return <ShoppingCart className="h-4 w-4 text-blue-600" />;
    case "DISPUTE":
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    case "CHAT":
      return <MessageSquare className="h-4 w-4 text-green-600" />;
    case "WALLET":
      return <Wallet className="h-4 w-4 text-yellow-600" />;
    case "REVIEW":
      return <Star className="h-4 w-4 text-amber-500" />;
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
};

const NotificationItem: React.FC<{ notification: Notification }> = ({
  notification,
}) => {
  const markAsRead = useMarkAsRead(notification.id);

  // Menggunakan primary/secondary dari globals.css
  const bgColor = notification.isRead
    ? "bg-transparent"
    : "bg-secondary/10 hover:bg-secondary/20";
  const textColor = notification.isRead ? "text-gray-600" : "text-primary";

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
      className={cn("block px-2 py-2 transition-colors", bgColor)}
    >
      <div className="flex items-start gap-3">
        {getIcon(notification.type)}
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm break-words leading-tight", textColor)}>
            {notification.content}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
              locale: idLocale,
            })}
          </p>
        </div>
        {!notification.isRead && (
          <div className="size-2 rounded-full bg-secondary shrink-0 mt-1"></div>
        )}
      </div>
    </Link>
  );
};

const NotificationDropdown = () => {
  const { notifications, isLoading, isError, refresh } = useNotifications();
  const { unreadCount, isLoadingCount } = useUnreadCount();
  const { markAllAsRead, isMutating } = useMarkAllAsRead();

  const handleMarkAll = async (e: React.MouseEvent) => {
    e.preventDefault();
    await markAllAsRead();
  };

  const [permission, setPermission] = React.useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = React.useState(false);

  React.useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }

    // Check if actually subscribed in SW
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then(async (registration) => {
        const sub = await registration.pushManager.getSubscription();
        setIsSubscribed(!!sub);

        // RESYNC: If we have a subscription, ensure backend has it too (in case of server restart)
        if (sub) {
          apiClient.post("/notifications/subscribe", sub)
            .catch(err => console.error("Failed to resync sub:", err));
        } else {
          // AUTO SUBSCRIBE
          handleSubscribe();
        }
      });
    }
  }, []);

  const handleSubscribe = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      // Request permission immediately
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult === 'granted') {
        function urlBase64ToUint8Array(base64String: string) {
          const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
          const base64 = (base64String + padding)
            .replace(/\-/g, "+")
            .replace(/_/g, "/");

          const rawData = window.atob(base64);
          const outputArray = new Uint8Array(rawData.length);

          for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
          }
          return outputArray;
        }

        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) return;

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });

        // Send to backend
        try {
          await apiClient.post("/notifications/subscribe", subscription);
          setIsSubscribed(true);
        } catch (error) {
          console.error("Failed to sync subscription to backend:", error);
          setIsSubscribed(true);
        }
      }
    } catch (error) {
      console.error("Failed to subscribe:", error);
    }
  };

  const handleUnsubscribe = async () => {
    if (!("serviceWorker" in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        // Notify backend to remove subscription
        await apiClient.post("/notifications/unsubscribe", { endpoint: subscription.endpoint })
          .catch(() => { });
      }
      setIsSubscribed(false);
    } catch (error) {
      console.error("Failed to unsubscribe:", error);
    }
  };

  const hasNotifications = notifications && notifications.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {isLoadingCount ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary/50" />
          ) : (
            <Bell className="h-5 w-5 text-primary" />
          )}

          {/* Badge Count */}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className={cn(
                "absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-bold ring-2 ring-background",
                "bg-red-500 hover:bg-red-600 text-white"
              )}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden">
        <div className="flex justify-between items-center px-4 py-2">
          <DropdownMenuLabel className="p-0 text-lg font-bold text-primary">Notifikasi</DropdownMenuLabel>

          {hasNotifications && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAll}
              disabled={isMutating || unreadCount === 0}
              className="h-7 text-xs p-1"
            >
              {isMutating ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <MailOpen className="mr-1 h-3 w-3" />
              )}
              Baca Semua
            </Button>
          )}
        </div>
        <DropdownMenuSeparator className="m-0" />

        {/* Kontainer Notifikasi (Scrollable) */}
        <ScrollArea className="h-[300px] w-full">
          {isLoading && (
            <div className="text-center py-10">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-gray-500 mt-2">Memuat...</p>
            </div>
          )}

          {isError && (
            <div className="text-center py-10 text-destructive">
              Gagal memuat notifikasi.
            </div>
          )}

          {!isLoading && notifications?.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
              <p className="text-sm">Tidak ada notifikasi saat ini.</p>
            </div>
          )}

          {notifications?.map((notif, index) => (
            <React.Fragment key={notif.id}>
              <NotificationItem notification={notif} />
              {index < notifications.length - 1 && <DropdownMenuSeparator className="m-0" />}
            </React.Fragment>
          ))}
        </ScrollArea>

        {/* Footer Actions */}
        {isSubscribed && (
          <div className="p-2 border-t mt-auto text-center bg-gray-50 flex flex-col gap-1">
            <Button
              variant="link"
              size="sm"
              onClick={async () => {
                try {
                  await apiClient.post("/notifications/test-push", {});
                } catch (error) {
                  console.error("Test push failed", error);
                }
              }}
              className="text-blue-600 text-xs w-full"
            >
              Tes Notifikasi
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationDropdown;