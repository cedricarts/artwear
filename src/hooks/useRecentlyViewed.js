import { useState, useCallback } from "react";

const STORAGE_KEY = "artwear_recently_viewed";
const MAX_ITEMS   = 8;

function readFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeToStorage(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // fail silently in private browsing mode
  }
}

export function useRecentlyViewed() {
  const [viewedIds, setViewedIds] = useState(readFromStorage);

  const addRecentlyViewed = useCallback((productId) => {
    setViewedIds((prev) => {
      const filtered = prev.filter((id) => id !== productId);
      const updated  = [productId, ...filtered].slice(0, MAX_ITEMS);
      writeToStorage(updated);
      return updated;
    });
  }, []);

  const clearRecentlyViewed = useCallback(() => {
    writeToStorage([]);
    setViewedIds([]);
  }, []);

  return { viewedIds, addRecentlyViewed, clearRecentlyViewed };
}
