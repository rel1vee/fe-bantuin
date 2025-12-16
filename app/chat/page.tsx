"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useChat } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import PublicLayout from "@/components/layouts/PublicLayout";
import { Loader2 } from "lucide-react";

function ChatRedirectContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const conversationId = searchParams.get("id");
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const { conversations, refreshConversations, openChatWith, isConnected } = useChat();

    useEffect(() => {
        // Redirect to login if not authenticated
        if (!authLoading && !isAuthenticated) {
            router.push("/auth/login?callbackUrl=/chat?id=" + conversationId);
            return;
        }

        if (!conversationId || !user) return;

        const findAndOpen = async () => {
            let targetConv = conversations.find((c) => c.id === conversationId);

            // If not found in current list, try refreshing
            if (!targetConv) {
                const freshRows = await refreshConversations();
                targetConv = freshRows.find((c) => c.id === conversationId);
            }

            if (targetConv) {
                const partner = targetConv.participants.find(p => p.user.id !== user.id)?.user;
                if (partner) {
                    openChatWith(partner);
                    // Redirect to homepage, chat window will open there
                    router.push("/");
                } else {
                    console.error("Partner not found in conversation");
                    router.push("/"); // Fallback
                }
            } else {
                // Conversation not found or invalid ID
                console.error("Conversation not found");
                router.push("/"); // Fallback
            }
        };

        findAndOpen();
    }, [conversationId, conversations, user, isAuthenticated, authLoading, router, refreshConversations, openChatWith]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Membuka percakapan...</p>
        </div>
    );
}

export default function ChatPage() {
    return (
        <PublicLayout>
            <Suspense fallback={
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            }>
                <ChatRedirectContent />
            </Suspense>
        </PublicLayout>
    );
}
