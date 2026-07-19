"use client";

/**
 * Auth context — wraps Firebase Auth state so any component can read the current
 * user and call sign-in/out. api.ts pulls the ID token from this same
 * firebaseAuth instance, so there's a single source of truth for auth state.
 *
 * Wrap the app with <AuthProvider> in app/layout.tsx to use this.
 *
 * @author Saamarth Attray
 */
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { firebaseAuth } from "./firebase";

interface AuthContextValue {
  user: User | null;
  /** True until the initial Firebase auth check resolves. */
  loading: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: Dispatch<SetStateAction<boolean>>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthModalOpen,
      setIsAuthModalOpen,
      signInWithGoogle: async () => {
        await signInWithPopup(firebaseAuth, new GoogleAuthProvider());
      },
      signOut: async () => {
        await firebaseSignOut(firebaseAuth);
      },
      
    }),
    [user, loading, isAuthModalOpen, setIsAuthModalOpen],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}