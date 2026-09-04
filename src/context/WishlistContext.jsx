import { createContext, useState, useEffect, useCallback } from "react";
import { collection, doc, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { db }      from "../firebase/firebase";
import { useAuth } from "../hooks/useAuth";

// eslint-disable-next-line react-refresh/only-export-components
export const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { currentUser } = useAuth();
  const [wishlistIds, setWishlistIds] = useState(new Set());

  useEffect(() => {
    if (!currentUser) {
      setWishlistIds(new Set());
      return;
    }
    const ref = collection(db, "wishlists", currentUser.uid, "items");
    const unsubscribe = onSnapshot(ref, (snap) => {
      setWishlistIds(new Set(snap.docs.map((d) => d.id)));
    });
    return unsubscribe;
  }, [currentUser]);

  const isWishlisted = useCallback(
    (productId) => wishlistIds.has(productId),
    [wishlistIds]
  );

  const toggleWishlist = async (product) => {
    if (!currentUser) return;
    const ref = doc(db, "wishlists", currentUser.uid, "items", product.id);
    if (wishlistIds.has(product.id)) {
      await deleteDoc(ref);
    } else {
      await setDoc(ref, { productId: product.id, name: product.name, addedAt: new Date() });
    }
  };

  const value = { wishlistIds, isWishlisted, toggleWishlist };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}
