"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

const getSocketUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5500/api";
  return apiUrl.replace(/\/api\/?$/, "");
};

const SOCKET_URL = getSocketUrl();

export interface Message {
  id: string;
  content: string;
  senderId: string;
  conversationId: string;
  createdAt: string;
  sender: {
    fullName: string;
    profilePicture: string | null;
  };
}

export interface Conversation {
  id: string;
  unreadCount?: number;
  lastMessage?: {
    content: string;
    senderId: string;
    createdAt: string;
  };
  participants: {
    user: {
      id: string;
      fullName: string;
      profilePicture: string | null;
      major?: string | null;
    };
  }[];
}

interface RecipientData {
  id: string;
  fullName: string;
  profilePicture: string | null;
  major?: string | null;
}

export interface ServicePreview {
  id: string;
  title: string;
  price: number;
  image: string;
  sellerId: string;
}

interface ChatContextType {
  socket: Socket | null;
  isConnected: boolean;

  isInboxOpen: boolean;
  toggleInbox: () => void;
  openInbox: () => void;

  activeConversation: Conversation | null;
  closeChatWindow: () => void;

  conversations: Conversation[];
  messages: Message[];
  unreadCount: number;

  // State baru untuk pending service
  pendingService: ServicePreview | null;
  setPendingService: (service: ServicePreview | null) => void;

  openChatWith: (
    recipient: RecipientData,
    initialMessage?: string,
    serviceData?: ServicePreview
  ) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  refreshConversations: () => Promise<Conversation[]>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingService, setPendingService] = useState<ServicePreview | null>(
    null
  );
  const [messagesCache, setMessagesCache] = useState<Record<string, Message[]>>(
    {}
  );
  const activeConversationRef = useRef(activeConversation);

  const markAsRead = async (conversationId: string) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      const res = await fetch(`/api/chat/${conversationId}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        console.error("Failed to mark as read:", res.statusText);
        return;
      }

      const data = await res.json();

      // Only update local state if API call was successful
      if (data.success) {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversationId ? { ...c, unreadCount: 0 } : c
          )
        );
      }
    } catch (e) {
      console.error("Error marking conversation as read:", e);
    }
  };

  useEffect(() => {
    const total = conversations.reduce(
      (acc, curr) => acc + (curr.unreadCount || 0),
      0
    );
    setUnreadCount(total);
  }, [conversations]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCache = localStorage.getItem("chat_messages_cache");
      if (savedCache) {
        try {
          setMessagesCache(JSON.parse(savedCache));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (Object.keys(messagesCache).length > 0) {
      localStorage.setItem(
        "chat_messages_cache",
        JSON.stringify(messagesCache)
      );
    }
  }, [messagesCache]);

  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  const fetchConversations = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return [];
      const res = await fetch("/api/chat", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setConversations(data.data);
        return data.data as Conversation[];
      }
      return [];
    } catch (error) {
      console.error(error);
      return [];
    }
  }, []);

  // 1. Setup Socket
  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) return;

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      console.log("✅ Socket Connected");
      setIsConnected(true);
      if (
        activeConversationRef.current &&
        activeConversationRef.current.id !== "new"
      ) {
        newSocket.emit("getHistory", activeConversationRef.current.id);
      }
    });

    newSocket.on("disconnect", () => setIsConnected(false));

    newSocket.on("newMessage", (message: Message) => {
      const chatId = message.conversationId;

      setMessagesCache((prevCache) => {
        const currentMessages = prevCache[chatId] || [];
        if (currentMessages.some((m) => m.id === message.id)) return prevCache;
        const filtered = currentMessages.filter(
          (m) => !(m.id.startsWith("temp-") && m.content === message.content)
        );
        return { ...prevCache, [chatId]: [...filtered, message] };
      });

      setConversations((prevConvs) => {
        // Cari index percakapan ini di list
        const index = prevConvs.findIndex((c) => c.id === chatId);

        // Jika belum ada (chat baru), terpaksa fetch ulang
        if (index === -1) {
          fetchConversations();
          return prevConvs;
        }

        // Copy array agar immutable
        const newConvs = [...prevConvs];

        // Hitung unreadCount baru
        const isCurrentChat = activeConversationRef.current?.id === chatId;
        let newUnread = newConvs[index].unreadCount || 0;
        if (!isCurrentChat && message.senderId !== user?.id) {
          newUnread += 1;
        }

        // Update lastMessage percakapan tersebut
        const updatedConv = {
          ...newConvs[index],
          unreadCount: newUnread,
          lastMessage: {
            content: message.content,
            senderId: message.senderId,
            createdAt: message.createdAt,
          },
        };

        // Pindahkan ke paling atas (Urutan 0) karena baru aktif
        newConvs.splice(index, 1); // Hapus dari posisi lama
        newConvs.unshift(updatedConv); // Masukkan ke atas

        // Jika chat sedang dibuka, tandai read di backend
        if (isCurrentChat && message.senderId !== user?.id) {
          markAsRead(chatId);
        }

        return newConvs;
      });
    });

    // Listener History
    newSocket.on("messageHistory", (history: Message[]) => {
      if (!history || history.length === 0) return;
      const chatId = history[0].conversationId;

      setMessagesCache((prevCache) => {
        const currentMessages = prevCache[chatId] || [];
        let pendingMessages = currentMessages.filter((m) =>
          m.id.startsWith("temp-")
        );

        pendingMessages = pendingMessages.filter((tempMsg) => {
          return !history.some(
            (histMsg) =>
              histMsg.content === tempMsg.content &&
              histMsg.senderId === tempMsg.senderId
          );
        });

        const combined = [...history, ...pendingMessages].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        const uniqueMessages = Array.from(
          new Map(combined.map((m) => [m.id, m])).values()
        );
        return { ...prevCache, [chatId]: uniqueMessages };
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, user, fetchConversations]);

  useEffect(() => {
    if (isAuthenticated) fetchConversations();
  }, [isAuthenticated, fetchConversations]);

  useEffect(() => {
    if (!activeConversation || activeConversation.id === "new") return;
    const cachedMessages = messagesCache[activeConversation.id];
    const hasMessages = cachedMessages && cachedMessages.length > 0;

    if ((!hasMessages || isConnected) && socket) {
      socket.emit("getHistory", activeConversation.id);
    }
  }, [activeConversation?.id, isConnected]);

  const toggleInbox = () => {
    if (!isInboxOpen) fetchConversations();
    setIsInboxOpen(!isInboxOpen);
  };

  const openInbox = () => {
    setIsInboxOpen(true);
    fetchConversations();
  };
  const closeChatWindow = () => {
    setActiveConversation(null);
  };

  const openChatWith = async (
    recipient: RecipientData,
    initialMessage?: string,
    serviceData?: ServicePreview
  ) => {
    if (!user) return;
    setIsInboxOpen(false);

    // Set pending service jika ada
    if (serviceData) {
      setPendingService(serviceData);
    } else {
      setPendingService(null);
    }

    let existing = conversations.find((c) =>
      c.participants.some((p) => p.user.id === recipient.id)
    );
    if (!existing) {
      const freshConversations = await fetchConversations();
      existing = freshConversations.find((c) =>
        c.participants.some((p) => p.user.id === recipient.id)
      );
    }

    if (existing) {
      setActiveConversation(existing);
      markAsRead(existing.id);
      if (socket && socket.connected) socket.emit("getHistory", existing.id);
    } else {
      setMessagesCache((prev) => ({ ...prev, new: [] }));
      const draftConversation: Conversation = {
        id: "new",
        participants: [
          { user: { ...recipient } },
          {
            user: {
              id: user.id,
              fullName: user.fullName,
              profilePicture: user.profilePicture,
              major: user.major,
            },
          },
        ],
      };
      setActiveConversation(draftConversation);
      if (initialMessage) setTimeout(() => sendMessage(initialMessage), 100);
    }
  };

  const sendMessage = async (content: string) => {
    if (!activeConversation || !user) return;

    const chatId = activeConversation.id;
    const tempId = `temp-${Date.now()}-${Math.random()}`;

    // 1. Buat object pesan optimistic
    const optimisticMsg: Message = {
      id: tempId,
      content,
      senderId: user.id,
      conversationId: chatId,
      createdAt: new Date().toISOString(),
      sender: { fullName: user.fullName, profilePicture: user.profilePicture },
    };

    // 2. Optimistic Update untuk Chat Window
    setMessagesCache((prev) => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), optimisticMsg],
    }));

    // 3. Optimistic Update untuk Inbox List
    setConversations((prevConvs) => {
      if (chatId === "new") return prevConvs;

      const index = prevConvs.findIndex((c) => c.id === chatId);
      if (index === -1) return prevConvs;

      const newConvs = [...prevConvs];
      const updatedConv = {
        ...newConvs[index],
        lastMessage: {
          content: content,
          senderId: user.id,
          createdAt: new Date().toISOString(),
        },
        // Opsional: update timestamp conversation agar naik ke atas
        // updatedAt: new Date().toISOString()
      };

      // Pindahkan ke paling atas
      newConvs.splice(index, 1);
      newConvs.unshift(updatedConv);

      return newConvs;
    });

    try {
      const recipient = activeConversation.participants.find(
        (p) => p.user.id !== user.id
      )?.user;
      if (!recipient) throw new Error("Recipient not found");

      const token = localStorage.getItem("access_token");
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientId: recipient.id,
          initialMessage: content,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const realConvId = data.data.id;

        if (activeConversation.id === "new") {
          await fetchConversations();
          setMessagesCache((prev) => {
            const draftMsgs = prev["new"] || [];
            const migratedMsgs = draftMsgs.map((m) => ({
              ...m,
              conversationId: realConvId,
            }));
            const newState = { ...prev };
            delete newState["new"];
            newState[realConvId] = [
              ...(prev[realConvId] || []),
              ...migratedMsgs,
            ];
            return newState;
          });
          setActiveConversation((prev) =>
            prev ? { ...prev, id: realConvId } : null
          );
        }

        if (socket && socket.connected) {
          socket.emit("getHistory", realConvId);
        }
      } else {
        throw new Error(data.error || "Failed");
      }
    } catch (error) {
      console.error(error);
      setMessagesCache((prev) => ({
        ...prev,
        [chatId]: (prev[chatId] || []).filter((m) => m.id !== tempId),
      }));
    }
  };

  const activeMessages = activeConversation
    ? messagesCache[activeConversation.id] || []
    : [];

  return (
    <ChatContext.Provider
      value={{
        socket,
        isConnected,
        isInboxOpen,
        toggleInbox,
        openInbox,
        activeConversation,
        closeChatWindow,
        conversations,
        messages: activeMessages,
        unreadCount,
        pendingService,
        setPendingService,
        openChatWith,
        sendMessage,
        refreshConversations: fetchConversations,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used within ChatProvider");
  return context;
};
