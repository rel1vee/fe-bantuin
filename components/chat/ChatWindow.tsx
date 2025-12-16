"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { useChat, ServicePreview } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { TbSend, TbClock, TbCheck, TbX } from "react-icons/tb";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { ServiceBubble } from "./ServiceBubble";
import { format, isToday, isYesterday } from "date-fns";
import { id } from "date-fns/locale";
// [UBAH] Gunakan useDebouncedCallback untuk fungsi, bukan useDebounce untuk value
import { useDebouncedCallback } from "use-debounce";

// Helper untuk format Rupiah
const formatPrice = (price: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
};

const getDateLabel = (dateString: string) => {
  const date = new Date(dateString);

  if (isToday(date)) {
    return "Hari Ini";
  }
  if (isYesterday(date)) {
    return "Kemarin";
  }

  return format(date, "d MMM yyyy", { locale: id });
};

const parseMessageContent = (content: string) => {
  try {
    if (content.startsWith('{"type":"service_inquiry"')) {
      return JSON.parse(content);
    }
    return null;
  } catch (e) {
    return null;
  }
};

export const ChatWindow = () => {
  const {
    messages,
    sendMessage,
    activeConversation,
    onlineUsers,
    typingUsers,
    sendTyping,
    pendingService,
    setPendingService,
  } = useChat();
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const messageTemplates = [
    "Assalamu'alaikum",
    "Wa'alaikumussalam",
    "Halo kak 👋",
    "Terima kasih 🙏",
    "Sama-sama 😊",
    "Apakah jasanya ready? 🤔",
    "Oke siap 👍",
    "Mantap kak 👏",
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // [BARU] Membuat fungsi debounce untuk stop typing
  // Fungsi ini hanya akan dijalankan 2000ms SETELAH user BERHENTI memanggilnya
  const handleStopTyping = useDebouncedCallback(() => {
    sendTyping(false);
  }, 2000);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);

    // Resize Textarea logic
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }

    // 1. Langsung kirim status "sedang mengetik" saat ada input
    sendTyping(true);

    // 2. Panggil fungsi debounce.
    // Setiap kali ini dipanggil, timer 2 detiknya di-reset ulang.
    // Jadi sendTyping(false) baru akan jalan kalau user diam selama 2 detik.
    handleStopTyping();
  };

  // [HAPUS] typingTimeout ref tidak lagi diperlukan
  // const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleTemplateClick = (text: string) => {
    setInput(text);
    if (textareaRef.current) {
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
          textareaRef.current.style.height = `${Math.min(
            textareaRef.current.scrollHeight,
            120
          )}px`;
          textareaRef.current.focus();
        }
      }, 0);
    }

    // [TAMBAHAN OPTIONAL] Jika template diklik, anggap juga sedang mengetik sebentar
    sendTyping(true);
    handleStopTyping();
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isSending) return;

    setIsSending(true);

    // [TAMBAHAN] Segera hentikan status typing saat pesan dikirim
    // Kita cancel debounce yang sedang berjalan agar tidak tumpang tindih
    handleStopTyping.cancel();
    sendTyping(false);

    let contentToSend = input;

    if (pendingService) {
      const payload = {
        type: "service_inquiry",
        service: pendingService,
        text: input,
      };
      contentToSend = JSON.stringify(payload);
    }

    if (textareaRef.current) textareaRef.current.style.height = "auto";
    await sendMessage(contentToSend);

    setIsSending(false);
    setInput("");
    setPendingService(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const otherParticipant = activeConversation?.participants?.find(
    (p) => p.user.id !== user?.id
  )?.user;

  // Cek apakah lawan bicara online
  const isOnline = otherParticipant
    ? onlineUsers.has(otherParticipant.id)
    : false;

  // Cek apakah lawan bicara sedang mengetik
  const isTyping = activeConversation
    ? typingUsers[activeConversation.id]
    : false;

  if (!otherParticipant)
    return <div className="p-4 text-center">Loading...</div>;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* AREA PESAN */}
      <div className="flex-1 h-0 overflow-hidden /50">
        <ScrollArea className="h-full px-3 py-3">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-xs text-center px-4 min-h-[300px]">
              <Avatar className="h-16 w-16 mb-3 opacity-50">
                <AvatarImage src={otherParticipant.profilePicture || ""} />
                <AvatarFallback className="text-2xl">
                  {otherParticipant.fullName[0]}
                </AvatarFallback>
              </Avatar>
              <p>
                Mulai percakapan dengan <br />{" "}
                <span className="font-semibold">
                  {otherParticipant.fullName}
                </span>
              </p>
            </div>
          ) : (
            <div className="space-y-1 pb-2">
              {messages.map((msg, idx) => {
                const isMe = msg.senderId === user?.id;
                const isOptimistic = msg.id.startsWith("temp-");

                const structuredData = parseMessageContent(msg.content);
                const isProductMessage = !!structuredData;
                const displayText = isProductMessage
                  ? structuredData.text
                  : msg.content;
                const serviceData: ServicePreview = isProductMessage
                  ? structuredData.service
                  : null;

                const currentDate = new Date(msg.createdAt);
                const previousMessage = messages[idx - 1];
                const previousDate = previousMessage
                  ? new Date(previousMessage.createdAt)
                  : null;

                const showDateSeparator =
                  !previousDate ||
                  currentDate.toDateString() !== previousDate.toDateString();

                return (
                  <Fragment key={msg.id || idx}>
                    {/* DATE SEPARATOR */}
                    {showDateSeparator && (
                      <div className="flex justify-center my-4  top-0 z-10">
                        <span className="text-[10px] font-medium text-gray-500 bg-gray-200/80 px-2.5 py-0.5 rounded-full shadow-sm backdrop-blur-sm border border-white/50">
                          {getDateLabel(msg.createdAt)}
                        </span>
                      </div>
                    )}

                    <div
                      className={`flex gap-2 w-full ${
                        isMe ? "justify-end" : "justify-start"
                      }`}
                    >
                      {!isMe && (
                        <Avatar className="h-8 w-8 mt-1 shrink-0">
                          <AvatarImage src={msg.sender.profilePicture || ""} />
                          <AvatarFallback className="text-xs">
                            {msg.sender.fullName[0]}
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div
                        className={`flex flex-col ${
                          isMe ? "items-end" : "items-start"
                        } max-w-[85%]`}
                      >
                        {isProductMessage && serviceData && (
                          <ServiceBubble service={serviceData} isMe={isMe} />
                        )}

                        <div
                          className={`relative px-4 py-2 text-sm rounded-2xl transition-all duration-200 flex flex-wrap gap-x-2 gap-y-0 items-end ${
                            isMe
                              ? "bg-linear-to-br from-primary to-secondary text-primary-foreground rounded-br-md shadow-md hover:shadow-lg border border-transparent"
                              : "bg-white border border-gray-200 text-foreground rounded-bl-md shadow-sm hover:shadow-md"
                          } ${
                            isOptimistic
                              ? "opacity-60 scale-95"
                              : "opacity-100 scale-100"
                          }`}
                        >
                          <p className="wrap-break-word whitespace-pre-wrap break-all leading-relaxed mb-0.5">
                            {displayText}
                          </p>

                          <div
                            className={`flex items-center gap-0.5 ml-auto shrink-0 h-fit ${
                              isMe
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                            }`}
                          >
                            <span className="text-[9px] leading-none select-none">
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>

                            {isMe && (
                              <span
                                className="ml-0.5"
                                title={
                                  isOptimistic ? "Mengirim..." : "Terkirim"
                                }
                              >
                                {isOptimistic ? (
                                  <TbClock className="h-2.5 w-2.5 animate-pulse" />
                                ) : (
                                  <TbCheck className="h-2.5 w-2.5" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Fragment>
                );
              })}
              <div ref={scrollRef} />
            </div>
          )}
        </ScrollArea>
      </div>

      {/* PREVIEW JASA */}
      {pendingService && (
        <div className="px-3 py-2  border-t border-gray-100 flex items-center justify-between animate-in slide-in-from-bottom-2">
          <div className="flex gap-3 items-center overflow-hidden">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-white border">
              {pendingService.image && (
                <Image
                  src={pendingService.image}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs text-primary font-bold">
                Menanyakan Jasa:
              </span>
              <span className="text-xs text-gray-600 truncate font-medium">
                {pendingService.title}
              </span>
              <span className="text-xs text-gray-500">
                {formatPrice(pendingService.price)}
              </span>
            </div>
          </div>
          <button
            onClick={() => setPendingService(null)}
            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
          >
            <TbX className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      )}

      {/* TEMPLATE PESAN */}
      <div className="px-3 pt-2 bg-white border-t border-gray-100">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mask-linear-fade">
          {messageTemplates.map((text, idx) => (
            <Badge
              key={idx}
              variant="outline"
              className="cursor-pointer hover:bg-primary hover:text-white active:scale-95 transition-all whitespace-nowrap px-3 py-1.5 font-normal text-xs border-primary/20 text-primary/80 bg-primary/5"
              onClick={() => handleTemplateClick(text)}
            >
              {text}
            </Badge>
          ))}
        </div>
      </div>

      {/* INDIKATOR TYPING */}
      {isTyping && (
        <div className="px-4 py-1 text-xs text-gray-500 italic animate-pulse">
          {otherParticipant?.fullName} sedang mengetik...
        </div>
      )}

          {/* INPUT PESAN DENGAN BATAS KARAKTER */}
      <div className="p-3 bg-white flex flex-col gap-2 shrink-0">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={
                pendingService
                  ? "Tulis pesan tentang jasa ini..."
                  : "Ketik pesan..."
              }
              className="flex-1 min-h-10 max-h-[120px] py-2 pr-16 resize-none overflow-y-auto"
              disabled={isSending}
              rows={1}
            />
            {/* Counter karakter */}
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground pointer-events-none">
              <span className={input.length > 4000 ? "text-red-500 font-medium" : ""}>
                {input.length}
              </span>
              <span className="text-gray-400">/4096</span>
            </div>
          </div>
          <Button
            onClick={() => handleSend()}
            size="icon"
            disabled={!input.trim() || isSending || input.length > 4096}
            className="h-10 w-10 shrink-0"
            title={input.length > 4096 ? "Pesan terlalu panjang (maks 4096 karakter)" : "Kirim pesan"}
          >
            <TbSend className="h-4 w-4" />
          </Button>
        </div>

        {/* Peringatan kalau terlalu panjang */}
        {input.length > 4000 && (
          <p className="text-xs text-red-500 animate-in fade-in slide-in-from-top-1">
            Pesan terlalu panjang! Maksimal 4096 karakter ({input.length - 4096} karakter berlebih)
          </p>
        )}
      </div>
    

    </div>
  );
};
