import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

// Make sure to set the following environment variables in your
// .env.local file (Next.js will expose vars prefixed with NEXT_PUBLIC_):
// NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
// NEXT_PUBLIC_FIREBASE_PROJECT_ID, NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
// NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, NEXT_PUBLIC_FIREBASE_APP_ID

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Firebase should only be initialized in the browser. When Next.js pre-renders
// on the server the env vars may be missing which would cause an error.
let authInstance = null as ReturnType<typeof getAuth> | null;

if (typeof window !== "undefined") {
  if (!getApps().length) {
    initializeApp(firebaseConfig);
  }
  authInstance = getAuth();
}

export const auth = authInstance; // may be null during SSR
