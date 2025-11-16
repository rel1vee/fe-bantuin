"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { FcGoogle } from "react-icons/fc";
import { TbTools } from "react-icons/tb";
import { HiMenu, HiX } from "react-icons/hi";
import { IoLogOut, IoSettingsOutline } from "react-icons/io5";
import { FiUser } from "react-icons/fi";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/public/logo.png";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, login, logout, loading } = useAuth();

  return (
    <header className="w-full sticky top-0 bg-white z-50 border-b border-b-accent">
      <div className="h-16 md:h-20 lg:h-24 flex px-4 sm:px-6 md:px-12 lg:px-24 xl:px-48 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Image
            src={Logo}
            alt="logo"
            width={128}
            height={128}
            className="md:w-10 md:h-10 lg:w-14 lg:h-14"
          />
          <h1 className="font-display text-primary font-bold text-2xl md:text-3xl">
            <Link className="" href="/">
              Bant<span className="text-secondary">uin</span>
            </Link>
          </h1>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex justify-between gap-2 items-center">
          <ul className="flex items-center justify-between gap-4">
            <li>
              <Button variant="link">
                <Link href="/why">Ngapain di Bantuin?</Link>
              </Button>
            </li>
            <li>
              <Button variant="link">
                <Link href="/who">Tentang Kami</Link>
              </Button>
            </li>
            <li>
              <Button variant="link">
                <Link href="/how">Cara Kerja</Link>
              </Button>
            </li>
          </ul>
        </nav>

        {/* Desktop Action Buttons */}
        <div className="hidden md:flex items-center gap-4">
          {loading ? (
            <div className="animate-pulse flex gap-2">
              <div className="h-10 w-32 bg-gray-200 rounded"></div>
              <div className="h-10 w-24 bg-gray-200 rounded"></div>
            </div>
          ) : isAuthenticated && user ? (
            <>
              <Button className="text-sm">
                <TbTools className="text-white" />
                <Link href="/seller/dashboard" className="hidden lg:inline">
                  Jadi Penyedia
                </Link>
                <Link href="/seller/dashboard" className="lg:hidden">
                  Penyedia
                </Link>
              </Button>

              {/* User Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                    {user.profilePicture ? (
                      <Image
                        src={user.profilePicture}
                        alt={user.fullName}
                        width={40}
                        height={40}
                        className="rounded-full border-2 border-primary hover:border-secondary transition-colors cursor-pointer"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full border-2 border-primary bg-gray-200 flex items-center justify-center">
                        <FiUser className="w-5 h-5 text-primary" />
                      </div>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.fullName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer">
                    <FiUser className="mr-2 h-4 w-4" />
                    <span>Profil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <IoSettingsOutline className="mr-2 h-4 w-4" />
                    <span>Pengaturan</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-red-600 focus:text-red-600"
                    onClick={logout}
                  >
                    <IoLogOut className="mr-2 h-4 w-4" />
                    <span>Keluar</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                className="text-sm lg:text-base"
                onClick={login}
                disabled={loading}
              >
                <FcGoogle />
                <span className="hidden sm:inline">Masuk</span>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-primary"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <HiX className="w-6 h-6" />
          ) : (
            <HiMenu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-accent bg-white">
          <nav className="px-4 py-4">
            <ul className="flex flex-col gap-2">
              <li>
                <Button variant="ghost" className="w-full justify-start">
                  <Link href="/why">Ngapain di Bantuin?</Link>
                </Button>
              </li>
              <li>
                <Button variant="ghost" className="w-full justify-start">
                  <Link href="/who">Tentang Kami</Link>
                </Button>
              </li>
              <li>
                <Button variant="ghost" className="w-full justify-start">
                  <Link href="/how">Cara Kerja</Link>
                </Button>
              </li>
            </ul>

            <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-accent">
              {isAuthenticated && user ? (
                <>
                  <div className="flex items-center gap-2 px-2 py-2">
                    {user.profilePicture ? (
                      <Image
                        src={user.profilePicture}
                        alt={user.fullName}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <FiUser className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {user.fullName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                  </div>
                  <Button className="w-full">
                    <TbTools className="text-white" />
                    Jadi Penyedia
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <FiUser className="mr-2 h-4 w-4" />
                    Profil
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <IoSettingsOutline className="mr-2 h-4 w-4" />
                    Pengaturan
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full text-red-600 hover:text-red-700"
                    onClick={logout}
                  >
                    <IoLogOut /> Keluar
                  </Button>
                </>
              ) : (
                <Button variant="outline" className="w-full" onClick={login}>
                  <FcGoogle /> Masuk
                </Button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
