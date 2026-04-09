import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const viteEnv = typeof import.meta !== "undefined" ? import.meta.env : undefined;

const firebaseConfig = {
    apiKey:
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
        viteEnv?.VITE_FIREBASE_API_KEY ||
        process.env.VITE_FIREBASE_API_KEY,
    authDomain:
        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
        viteEnv?.VITE_FIREBASE_AUTH_DOMAIN ||
        process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId:
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
        viteEnv?.VITE_FIREBASE_PROJECT_ID ||
        process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket:
        process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
        viteEnv?.VITE_FIREBASE_STORAGE_BUCKET ||
        process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId:
        process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
        viteEnv?.VITE_FIREBASE_MESSAGING_SENDER_ID ||
        process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId:
        process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
        viteEnv?.VITE_FIREBASE_APP_ID ||
        process.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const isBrowser = typeof window !== "undefined";

if (isBrowser && (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId)) {
    console.error("Missing Firebase client config. Check NEXT_PUBLIC_FIREBASE_* env vars.");
}

// In Next.js server evaluation, avoid initializing browser-only Firebase services.
export const auth = (isBrowser ? getAuth(app) : null) as Auth;
export const db = (isBrowser ? getFirestore(app) : null) as Firestore;
