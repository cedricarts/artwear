import { createContext, useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase/firebase";

// eslint-disable-next-line react-refresh/only-export-components
export const ProductContext = createContext(null);

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("Product listener error:", err);
        setError(err);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  const value = { products, loading, error };

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
}
