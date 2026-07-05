"use client";

import Image from "next/image";
import Link from "next/link";
import { FaRegUser } from "react-icons/fa";
import { useAuth } from "@/lib/auth-context";

function NavBar() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  return (
    <div className="h-[10vh]">
        <div className="row flex justify-between items-center h-full gap-3">
            <figure>
                {/* Todo: create app logo
                <Image
                    src=""
                    alt="Voice print AI logo"
                    width={24}
                    height={40} /> */}
                <div className="w-24 h-12 bg-gray-300"></div>
            </figure>
            <div className="flex justify-between items-center gap-8 font-medium">
                <Link href={'/'} legacyBehavior><a className="link__hover-effect">Home</a></Link>
                <Link href={'/dashboard'} legacyBehavior><a className="link__hover-effect">Dashboard</a></Link>
                <button
                    aria-label={user ? "sign out" : "sign in"}
                    onClick={user ? () => void signOut() : () => void signInWithGoogle()}
                    disabled={loading}
                    title={user ? `Signed in as ${user.email ?? user.uid}` : "Sign in"}
                    className="w-10 h-10 rounded-[50%] bg-gray-100 flex justify-center items-center disabled:opacity-50">
                    <FaRegUser size={20} />
                </button>
            </div>
        </div>
    </div>
  )
}

export default NavBar