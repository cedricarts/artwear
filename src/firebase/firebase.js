import { initializeApp }  from "firebase/app";
import { getFirestore }   from "firebase/firestore";
import { getAuth }        from "firebase/auth";
import { getAnalytics }   from "firebase/analytics";

// Values are injected at BUILD TIME by Vite from .env locally, or
// from the environment variables set in the Netlify dashboard when
// deployed. If any of these come through as `undefined`, check:
//   1. Locally: does .env exist (copied from .env.example) and are
//      you restarting `npm run dev` after editing it? Vite only
//      reads .env on server start, not on hot-reload.
//   2. On Netlify: are the same VITE_ vars set under
//      Site settings > Environment variables? They must be set
//      BEFORE a deploy for that deploy to have them — adding them
//      after the fact requires triggering a new deploy.
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

if (import.meta.env.DEV && !firebaseConfig.apiKey) {
  // Loud failure in dev only — don't want this console warning
  // showing up for real customers in a broken prod build.
  console.warn(
    "[firebase.js] Missing VITE_FIREBASE_* env vars. Did you copy .env.example to .env and fill it in?"
  );
}

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app); // optional, only if you want analytics

export const db   = getFirestore(app);
export const auth = getAuth(app);

