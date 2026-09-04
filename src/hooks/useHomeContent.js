import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebase";

const DEFAULT_CONTENT = { banner: { enabled: false }, slides: [], featuredProductIds: [] };

export function useHomeContent() {
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ref = doc(db, "siteContent", "home");
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        setContent(snap.exists() ? { ...DEFAULT_CONTENT, ...snap.data() } : DEFAULT_CONTENT);
        setLoading(false);
      },
      (err) => {
        console.error("useHomeContent:", err);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  return { ...content, loading };
}
