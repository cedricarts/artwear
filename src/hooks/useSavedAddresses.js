import { useState, useEffect, useCallback } from "react";
import {
  collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp, orderBy, query, writeBatch,
} from "firebase/firestore";
import { db }      from "../firebase/firebase";
import { useAuth } from "./useAuth";

export function useSavedAddresses() {
  const { currentUser }           = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading,   setLoading]   = useState(false);

  const fetchAddresses = useCallback(async () => {
    if (!currentUser) { setAddresses([]); return; }
    setLoading(true);
    try {
      const q    = query(collection(db, "users", currentUser.uid, "addresses"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setAddresses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Failed to fetch addresses:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => { fetchAddresses(); }, [fetchAddresses]);

  const saveAddress = async (formData, isDefault = false) => {
    if (!currentUser) return;
    const ref = collection(db, "users", currentUser.uid, "addresses");

    if (isDefault) {
      const batch = writeBatch(db);
      addresses.forEach((a) => {
        if (a.isDefault) {
          batch.update(doc(db, "users", currentUser.uid, "addresses", a.id), { isDefault: false });
        }
      });
      await batch.commit();
    }

    await addDoc(ref, { ...formData, isDefault, createdAt: serverTimestamp() });
    await fetchAddresses();
  };

  const deleteAddress = async (addressId) => {
    if (!currentUser) return;
    await deleteDoc(doc(db, "users", currentUser.uid, "addresses", addressId));
    setAddresses((prev) => prev.filter((a) => a.id !== addressId));
  };

  const setDefaultAddress = async (addressId) => {
    if (!currentUser) return;
    const batch = writeBatch(db);
    addresses.forEach((a) => {
      batch.update(doc(db, "users", currentUser.uid, "addresses", a.id), { isDefault: a.id === addressId });
    });
    await batch.commit();
    await fetchAddresses();
  };

  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;

  return { addresses, loading, defaultAddress, saveAddress, deleteAddress, setDefaultAddress, refetch: fetchAddresses };
}
