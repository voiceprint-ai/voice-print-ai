"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavModalProps {
  onClose: () => void;
}

function NavModal({ onClose }: NavModalProps) {
  const pathname = usePathname();

  return (
    /* Invisible full-screen backdrop — click anywhere to close */
    <div
      className="fixed inset-0 z-40"
      aria-hidden="true"
      onClick={onClose}
    >
      {/* Dropdown panel — stop propagation so clicks inside don't close */}
      <nav
        aria-label="Mobile navigation"
        className="absolute right-4 top-18 w-44 bg-paper rounded-xl border border-ink-900/10 shadow-lg py-1 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <Link
          href="/"
          onClick={onClose}
          aria-current={pathname === "/" ? "page" : undefined}
          className="px-4 py-2.5 text-sm font-medium hover:bg-paper-dim transition-colors"
        >
          Home
        </Link>
        <Link
          href="/dashboard"
          onClick={onClose}
          aria-current={pathname === "/dashboard" ? "page" : undefined}
          className="px-4 py-2.5 text-sm font-medium hover:bg-paper-dim transition-colors"
        >
          Dashboard
        </Link>
        <Link
          href="/projects"
          onClick={onClose}
          aria-current={pathname.startsWith("/projects") ? "page" : undefined}
          className="px-4 py-2.5 text-sm font-medium hover:bg-paper-dim transition-colors"
        >
          Projects
        </Link>
      </nav>
    </div>
  );
}

export default NavModal;
