"use client";

import { useChat } from "@/contexts/ChatContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TbMail } from "react-icons/tb";
import { ChatInboxList } from "./ChatInboxList";

const InboxDropdown = () => {
  const { unreadCount } = useChat();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full hover:bg-gray-100 text-gray-600"
        >
          <TbMail className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center border border-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 md:w-96 p-0 rounded-xl shadow-xl border-gray-200 mt-2"
      >
        <DropdownMenuLabel className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
          <span className="font-bold text-lg text-gray-900">Pesan</span>
        </DropdownMenuLabel>

        <div className="max-h-[400px] overflow-y-auto">
          <ChatInboxList />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default InboxDropdown;
