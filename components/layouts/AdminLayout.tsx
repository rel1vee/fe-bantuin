// components/layouts/AdminLayout.tsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  TbLockAccess,
  TbWallet,
  TbLogout,
  TbMenu2,
  TbChevronRight,
  TbLayoutDashboard,
  TbClipboard,
  TbUsers,
  TbCpu,
  TbFlag,
} from "react-icons/tb";
import Logo from "@/public/logo.svg";

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface MenuItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { user, logout, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push("/");
        return;
      }

      if (user && user.role !== "ADMIN") {
        alert("Akses ditolak. Anda bukan Administrator.");
        router.push("/");
      }
    }
  }, [loading, isAuthenticated, user, router]);

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  const menuItems: MenuItem[] = [
    { icon: TbClipboard, label: "Review", href: "/admin/reviews" },
    { icon: TbLayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
    { icon: TbWallet, label: "Penarikan Dana", href: "/admin/payouts" },
    { icon: TbFlag, label: "Laporan Masalah", href: "/admin/reports" },
    { icon: TbUsers, label: "Pengguna", href: "/admin/users" },
    { icon: TbCpu, label: "System Tasks", href: "/admin/tasks" },
  ];

  const isActive = (href: string) => pathname.startsWith(href);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const Breadcrumbs = () => {
    const segments = pathname.split("/").filter((item) => item !== "");
    const displaySegments = segments.filter((seg) => seg !== "admin");

    return (
      <nav
        aria-label="Breadcrumb"
        className="hidden lg:flex items-center text-sm"
      >
        <ol className="flex items-center gap-1.5">
          <li>
            <Link
              href="/"
              className="flex items-center gap-1.5 font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <span>Home</span>
            </Link>
          </li>
          {displaySegments.map((segment, index) => {
            const path = `/${segments.slice(0, index + 2).join("/")}`;
            const isLast = index === displaySegments.length - 1;
            const label = segment.charAt(0).toUpperCase() + segment.slice(1);

            return (
              <li key={path} className="flex items-center gap-1.5">
                <TbChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                {isLast ? (
                  <span className="font-semibold text-primary">{label}</span>
                ) : (
                  <Link
                    href={path}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    );
  };

  const SidebarContent = ({ onItemClick }: { onItemClick?: () => void }) => (
    <div className="flex flex-col h-full bg-card">
      {/* Logo - Compact */}
      <div className="flex items-center gap-2.5 px-5 h-14 border-b border-border/50">
        <div className="relative">
          <Image
            src={Logo}
            alt="logo"
            width={32}
            height={32}
            className="object-contain"
          />
        </div>
        <div>
          <h1 className="font-display text-primary font-bold text-xl">
            Bant<span className="text-secondary">uin</span>
          </h1>
          <p className="text-[10px] text-muted-foreground font-medium">
            Control Panel
          </p>
        </div>
      </div>

      {/* Navigation - Compact */}
      <ScrollArea className="flex-1 px-2.5 py-3">
        <nav className="space-y-0.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link key={item.href} href={item.href} onClick={onItemClick}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start gap-2.5 h-9 text-sm font-medium transition-all duration-200 ${
                    active
                      ? "bg-linear-to-r from-primary/10 via-primary/5 to-transparent text-primary border-l-2 border-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} />
                  <span>{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator className="bg-border/50" />

      {/* User Info - Compact */}
      <div className="px-3 py-3">
        <div className="flex items-center gap-2.5 px-2.5 py-2 bg-muted/30 rounded-lg border border-border/30">
          <Avatar className="h-8 w-8 ring-2 ring-primary/20">
            <AvatarImage
              src={user?.profilePicture || ""}
              alt={user?.fullName}
            />
            <AvatarFallback className="bg-linear-to-br from-primary to-secondary text-primary-foreground text-xs font-semibold">
              {user?.fullName ? getInitials(user.fullName) : "A"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">
              {user?.fullName || "Administrator"}
            </p>
            <p className="text-[10px] text-muted-foreground">Admin Access</p>
          </div>
        </div>
      </div>

      {/* Bottom Actions - Compact */}
      <div className="px-2.5 pb-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2.5 h-9 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive font-medium"
          onClick={() => {
            logout();
            onItemClick?.();
          }}
        >
          <TbLogout className="h-4 w-4" />
          <span>Keluar</span>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-ghost overflow-hidden">
      {/* Desktop Sidebar - Sleek */}
      <aside className="hidden lg:flex lg:w-60 lg:flex-col border-r border-border/50 bg-card shadow-sm">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-60">
          <SheetHeader className="sr-only">
            <SheetTitle>Menu Admin</SheetTitle>
          </SheetHeader>
          <SidebarContent onItemClick={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - Compact & Modern */}
        <header className="shrink-0 bg-card/80 backdrop-blur-sm border-b border-border/50 shadow-sm">
          <div className="flex items-center justify-between h-14 px-4 lg:px-6">
            {/* Mobile Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9 hover:bg-primary/10"
              onClick={() => setSidebarOpen(true)}
            >
              <TbMenu2 className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>

            {/* Breadcrumb */}
            <Breadcrumbs />
            {/* User Badge - Compact */}
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 ring-2 ring-primary/20 ring-offset-1 ring-offset-background">
                <AvatarImage
                  src={user?.profilePicture || ""}
                  alt={user?.fullName}
                />
                <AvatarFallback className="bg-linear-to-br from-primary to-secondary text-primary-foreground text-xs font-bold">
                  {user?.fullName ? getInitials(user.fullName) : "A"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-ghost">
          <div className="py-5 px-4 lg:px-6">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
