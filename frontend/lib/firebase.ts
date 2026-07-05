/**
 * Firebase client SDK initialization.
 *
 * This config (apiKey, authDomain, etc.) is the PUBLIC client config — it's meant
 * to be visible in browser bundles, unlike the backend's service-account key.
 * Firebase security comes from Firestore rules + our backend's token verification,
 * not from hiding this config.
 *
 * All values are read from NEXT_PUBLIC_* env vars so nothing is hardcoded here.
 * See .env.local.example for the required keys.
 *
 * @author Saamarth Attray
 */
import { getApps, initializeApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.local.example to .env.local and fill in your Firebase web config.`,
    );
  }
  return value;
}

const firebaseConfig: FirebaseOptions = {
  apiKey: required("NEXT_PUBLIC_FIREBASE_API_KEY", process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: required(
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  ),
  projectId: required(
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  ),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: required("NEXT_PUBLIC_FIREBASE_APP_ID", process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
};

// Next.js hot-reloads modules in dev; guard against re-initializing the app.
export const firebaseApp = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);