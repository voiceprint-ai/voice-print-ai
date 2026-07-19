"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaRegUser } from "react-icons/fa";
import { RxHamburgerMenu } from "react-icons/rx";
import { useAuth } from "@/lib/auth-context";
import NavModal from "./NavModal";

function Header() {
  const { user, loading, setIsAuthModalOpen } = useAuth();
  const pathname = usePathname();
  const [isNavOpen, setIsNavOpen] = useState(false);

  return (
    <header className="border-b border-ink-900/10">
      <div className="row flex justify-between items-center h-18 gap-3">
        <Link href="/" className="font-display font-bold text-xl tracking-tight">
          Voiceprint<span className="text-indigo-600">.</span>
        </Link>
        <div className="flex justify-between items-center gap-2 sm:gap-8">
          <nav aria-label="Main" className="justify-between items-center gap-8 text-md font-medium hidden sm:flex">
            <Link
              className="link__hover-effect"
              href="/"
              aria-current={pathname === "/" ? "page" : undefined}
            >
              Home
            </Link>
            <Link
              className="link__hover-effect"
              href="/dashboard"
              aria-current={pathname === "/dashboard" ? "page" : undefined}
            >
              Dashboard
            </Link>
            <Link
              className="link__hover-effect"
              href="/projects"
              aria-current={pathname.startsWith("/projects") ? "page" : undefined}
            >
              Projects
            </Link>
          </nav>

          {/* Hamburger menu — visible only on small screens */}
          <button
            aria-label="Open navigation menu"
            aria-expanded={isNavOpen}
            onClick={() => setIsNavOpen(true)}
            className="w-10 h-10 rounded-full flex sm:hidden justify-center items-center hover:bg-ink-900/8 transition-colors"
          >
            <RxHamburgerMenu size={24} aria-hidden="true" />
          </button>

          <button
            aria-label={loading ? "Loading account status" : "Open account menu"}
            onClick={() => setIsAuthModalOpen(true)}
            disabled={loading}
            title={user ? `Signed in as ${user.email ?? user.uid}` : "Sign in"}
            className="w-10 h-10 rounded-full flex justify-center items-center hover:bg-indigo-600 hover:text-paper transition-colors bg-ink-900"
          >
            <FaRegUser size={18} aria-hidden="true" className="text-white" />
          </button>
        </div>
      </div>
      {isNavOpen && <NavModal onClose={() => setIsNavOpen(false)} />}
    </header>
  );
}

export default Header;