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
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // TAMBAH INI SAJA
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
  const { notifications, isLoading } = useNotifications();
  const { unreadCount, isLoadingCount } = useUnreadCount();
  const { markAllAsRead, isMutating } = useMarkAllAsRead();

  const handleMarkAll = async (e: React.MouseEvent) => {
    e.preventDefault();
    await markAllAsRead();
  };
  const hasNotifications = notifications && notifications.length > 0;

  // FETCHER DENGAN TOKEN DARI LOCALSTORAGE (ini yang dipakai)
  const fetcher = async (url: string) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.warn('No access_token in localStorage');
      return { data: [] };
    }
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      console.error('Activity fetch failed:', res.status);
      return { data: [] };
    }
    return res.json();
  };

  // FETCH ACTIVITY LOG
  const { data: activityData } = useSWR('/api/activity', fetcher, {
    refreshInterval: 30000,
  });
  const activities: ActivityLog[] = activityData?.data || [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {isLoadingCount ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary/50" />
          ) : (
            <Bell className="h-5 w-5 text-primary" />
          )}
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

      <DropdownMenuContent align="end" className="w-96 p-0 overflow-hidden">
        {/* TAMBAH TABS DI SINI */}
        <Tabs defaultValue="notifications" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-none h-11">
            <TabsTrigger value="notifications" className="text-sm">
              Notifikasi
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2 text-xs px-1">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-sm">
              Aktivitas
            </TabsTrigger>
          </TabsList>

          {/* TAB NOTIFIKASI */}
          <TabsContent value="notifications" className="mt-0">
            <div className="flex justify-between items-center px-4 py-2 border-b">
              <p className="text-base font-bold">Notifikasi</p>
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

            <ScrollArea className="h-[320px] w-full">
              {isLoading && (
                <div className="text-center py-10">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                  <p className="text-sm text-gray-500 mt-2">Memuat...</p>
                </div>
              )}
              {!isLoading && notifications?.length === 0 && (
                <div className="text-center py-12 text-gray-500">
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
          </TabsContent>

          {/* TAB AKTIVITAS */}
          <TabsContent value="activity" className="mt-0">
            <div className="px-4 py-2 border-b bg-gray-50">
              <p className="text-base font-bold">Riwayat Aktivitas</p>
            </div>

            <ScrollArea className="h-[320px] w-full">
              {activities.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-sm">Belum ada aktivitas</p>
                </div>
              ) : (
                activities.slice(0, 15).map((log, index) => (
                  <div
                    key={`activity-${index}`}
                    className="px-4 py-3 hover:bg-gray-50 flex gap-3 border-b last:border-0"
                  >
                    <div className="mt-1">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <ArrowRight className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {log.action.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">{log.details}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {log.device || 'Perangkat tidak diketahui'} •{' '}
                        {formatDistanceToNow(new Date(log.timestamp), {
                          addSuffix: true,
                          locale: idLocale,
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Link ke halaman lengkap */}
        <div className="p-3 text-center border-t bg-gray-50">
          <Link href="/notifications" className="text-sm text-primary hover:underline font-medium">
            Lihat semua notifikasi & riwayat →
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationDropdown;