export interface Notification {
  id: string;
  userId: string;
  content: string;
  isRead: boolean;
  link: string | null;
  type: 'GENERAL' | 'ORDER' | 'DISPUTE' | 'WALLET' | 'REVIEW' | 'CHAT';
  createdAt: string;
}

export interface UnreadCountResponse {
  count: number;
}