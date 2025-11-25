import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import { apiClient } from '@/lib/api-client'; // Anggap apiClient sudah diupdate untuk auth
import type { Notification, UnreadCountResponse } from '@/app/types/notification';

// Fetcher dasar, mengasumsikan API response mengikuti format { success: boolean, data: T }
const fetcher = (url: string) => apiClient.get<any>(url).then(res => res.data);
const postFetcher = (url: string, { arg }: { arg?: any }) => apiClient.post(url, arg);
// Ambil fungsi mutate global dari hook notifikasi untuk sinkronisasi
const notificationKey = '/notifications';
const unreadCountKey = '/notifications/unread-count';

// 1. Hook untuk mendapatkan jumlah notifikasi belum dibaca
export const useUnreadCount = () => {
  const { data, error, isLoading, mutate } = useSWR<UnreadCountResponse>(
    unreadCountKey, 
    fetcher
  );

  return {
    unreadCount: data?.count || 0,
    isLoadingCount: isLoading,
    isErrorCount: error,
    refreshCount: mutate,
    mutate, // Export mutate untuk dipanggil dari hook lain
  };
};

// 2. Hook untuk mendapatkan daftar notifikasi
export const useNotifications = () => {
  const { data, error, isLoading, mutate } = useSWR<Notification[]>(
    notificationKey, 
    fetcher
  );

  return {
    notifications: data,
    isLoading,
    isError: error,
    refresh: mutate,
    mutate, // Export mutate untuk dipanggil dari hook lain
  };
};

// 3. Hook untuk menandai satu notifikasi sebagai sudah dibaca
export const useMarkAsRead = (notificationId: string) => {
  const { trigger } = useSWRMutation(
    `/notifications/${notificationId}/read`, 
    postFetcher
  );
  
  const { mutate: mutateNotifications } = useNotifications();
  const { mutate: mutateUnreadCount } = useUnreadCount();

  const markAsRead = async () => {
    // Optimistic Update (opsional, tapi disarankan)
    mutateNotifications((current) => 
      current?.map(n => n.id === notificationId ? { ...n, isRead: true } : n), 
      { revalidate: false }
    );
    mutateUnreadCount((countData) => ({ count: Math.max(0, (countData?.count || 0) - 1) }), { revalidate: false });

    await trigger();
    
    // Revalidate setelah sukses (untuk memastikan sinkronisasi)
    await Promise.all([
      mutateNotifications(),
      mutateUnreadCount(),
    ]);
  };

  return markAsRead;
};

// 4. Hook untuk menandai semua notifikasi sebagai sudah dibaca
export const useMarkAllAsRead = () => {
  const { trigger, isMutating } = useSWRMutation(
    '/notifications/read-all', 
    postFetcher
  );
  
  const { mutate: mutateNotifications } = useNotifications();
  const { mutate: mutateUnreadCount } = useUnreadCount();

  const markAllAsRead = async () => {
    // Optimistic Update: Tandai semua notif sebagai dibaca
    mutateNotifications((current) => current?.map(n => ({ ...n, isRead: true })), { revalidate: false });
    mutateUnreadCount(() => ({ count: 0 }), { revalidate: false });

    await trigger();
    
    // Revalidate setelah sukses
    await mutateNotifications();
  };

  return { markAllAsRead, isMutating };
};