import { useState, useEffect, useCallback } from "react";
import {
  collection, addDoc, getDocs, orderBy, query, doc, runTransaction, serverTimestamp,
} from "firebase/firestore";
import { db }      from "../firebase/firebase";
import { useAuth } from "./useAuth";

export function useReviews(productId) {
  const { currentUser } = useAuth();
  const [reviews,    setReviews]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const q    = query(collection(db, "products", productId, "reviews"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setReviews(snap.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() })));
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const submitReview = async ({ rating, comment }) => {
    if (!currentUser || !productId) return;
    setSubmitting(true);
    try {
      const productRef = doc(db, "products", productId);
      await runTransaction(db, async (transaction) => {
        const productSnap = await transaction.get(productRef);
        const data        = productSnap.data() ?? {};
        const prevCount   = data.reviewCount ?? 0;
        const prevAvg     = data.avgRating   ?? 0;
        const newCount    = prevCount + 1;
        const newAvg      = (prevAvg * prevCount + rating) / newCount;

        transaction.update(productRef, { reviewCount: newCount, avgRating: newAvg });

        const reviewRef = doc(collection(db, "products", productId, "reviews"));
        transaction.set(reviewRef, {
          uid: currentUser.uid,
          displayName: currentUser.displayName ?? currentUser.email.split("@")[0],
          photoURL: currentUser.photoURL ?? null,
          rating, comment: comment.trim(),
          createdAt: serverTimestamp(),
        });
      });
      await fetchReviews();
    } catch (err) {
      console.error("Review submission failed:", err);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  return { reviews, loading, submitting, submitReview, refetch: fetchReviews };
}
