"use client";

import { useChat } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import { TbX } from "react-icons/tb";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatWindow } from "./ChatWindow";

export const ChatFloatingWindow = () => {
  const { isAuthenticated, user } = useAuth();
  const { activeConversation, closeChatWindow, onlineUsers } = useChat();

  if (!isAuthenticated || !activeConversation) return null;

  const otherParticipant = activeConversation.participants.find(
    (p) => p.user.id !== user?.id
  )?.user;

  const profilPartisipan = otherParticipant?.profilePicture;
  const namaPartisipan = otherParticipant?.fullName || "Percakapan";

  const isOnline = otherParticipant
    ? onlineUsers.has(otherParticipant.id)
    : false;

  return (
    <div className="fixed z-50 inset-0 md:inset-auto md:bottom-10 md:left-6 flex flex-col items-start justify-end md:justify-start">
      <div className="w-full h-dvh md:w-[400px] md:h-[500px] md:max-h-[calc(100vh-5rem)] bg-white md:shadow-2xl md:border border-primary/20 rounded-none md:rounded-xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
        {/* Header */}
        <div className="p-3 px-4 bg-white border-b text-secondary-foreground flex items-center justify-between shrink-0 safe-area-top">
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="h-9 w-9 border-2 border-secondary-foreground/20 shrink-0">
                <AvatarImage src={profilPartisipan || ""} />
                <AvatarFallback>{namaPartisipan[0]}</AvatarFallback>
              </Avatar>

              {/* Status Dot */}
              {isOnline && (
                <span
                  className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white"
                  title="Online"
                />
              )}
            </div>

            <div className="flex flex-col min-w-0">
              <h3 className="font-semibold text-sm md:text-base line-clamp-1 leading-tight">
                {namaPartisipan}
              </h3>
              <span
                className={`text-xs ${
                  isOnline
                    ? "text-green-600 font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>
          </div>

          {/* Tombol Close */}
          <button
            onClick={closeChatWindow}
            className="hover:bg-primary-foreground/20 p-2 md:p-1 rounded-full md:rounded transition-colors shrink-0"
          >
            <TbX className="h-6 w-6 md:h-5 md:w-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden bg-white relative">
          <ChatWindow />
        </div>
      </div>
    </div>
  );
};
