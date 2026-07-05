"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaRegUser } from "react-icons/fa";
import { useAuth } from "@/lib/auth-context";

function NavBar() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const pathname = usePathname();

  return (
    <header className="border-b border-ink-900/10">
      <div className="row flex justify-between items-center h-20 gap-3">
        <Link href="/" className="font-display font-bold text-lg tracking-tight">
          Voiceprint<span className="text-indigo-600">.</span>
        </Link>

        <nav aria-label="Main" className="flex justify-between items-center gap-8 font-medium">
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
            aria-current={pathname?.startsWith("/dashboard") ? "page" : undefined}
          >
            Dashboard
          </Link>
          <button
            aria-label={loading ? "Loading account status" : user ? "Sign out" : "Sign in with Google"}
            onClick={user ? () => void signOut() : () => void signInWithGoogle()}
            disabled={loading}
            title={user ? `Signed in as ${user.email ?? user.uid}` : "Sign in"}
            className="w-11 h-11 rounded-full bg-paper-dim flex justify-center items-center hover:bg-indigo-600 hover:text-paper transition-colors"
          >
            <FaRegUser size={18} aria-hidden="true" />
          </button>
        </nav>
      </div>
    </header>
  );
}

export default NavBar;