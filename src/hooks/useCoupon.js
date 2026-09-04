import { useState, useCallback } from "react";
import { doc, getDoc }           from "firebase/firestore";
import { db }                    from "../firebase/firebase";

export function useCoupon(cartTotal) {
  const [appliedCoupon,  setAppliedCoupon]  = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [status,         setStatus]         = useState("idle");
  const [errorMsg,       setErrorMsg]       = useState(null);

  const validateCoupon = useCallback(async (rawCode) => {
    const code = rawCode.trim().toUpperCase();
    if (!code) return;
    setStatus("loading");
    setErrorMsg(null);

    try {
      const snap = await getDoc(doc(db, "coupons", code));
      if (!snap.exists()) {
        setStatus("error"); setErrorMsg("Invalid coupon code."); return;
      }
      const coupon = { id: snap.id, ...snap.data() };
      if (!coupon.active) {
        setStatus("error"); setErrorMsg("This coupon is no longer active."); return;
      }
      if (coupon.expiresAt) {
        const expiry = coupon.expiresAt.toDate ? coupon.expiresAt.toDate() : new Date(coupon.expiresAt);
        if (expiry < new Date()) {
          setStatus("error"); setErrorMsg("This coupon has expired."); return;
        }
      }
      if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
        setStatus("error"); setErrorMsg("This coupon has reached its usage limit."); return;
      }
      if (coupon.minOrder > 0 && cartTotal < coupon.minOrder) {
        setStatus("error");
        setErrorMsg(`Minimum order of R ${coupon.minOrder.toFixed(2)} required for this coupon.`);
        return;
      }

      let discount = 0;
      if (coupon.type === "percentage") discount = cartTotal * (coupon.value / 100);
      else if (coupon.type === "fixed") discount = Math.min(coupon.value, cartTotal);
      discount = Math.round(discount * 100) / 100;

      setAppliedCoupon(coupon);
      setDiscountAmount(discount);
      setStatus("valid");
    } catch (err) {
      console.error("Coupon validation error:", err);
      setStatus("error");
      setErrorMsg("Could not validate coupon. Please try again.");
    }
  }, [cartTotal]);

  const clearCoupon = useCallback(() => {
    setAppliedCoupon(null); setDiscountAmount(0); setStatus("idle"); setErrorMsg(null);
  }, []);

  const finalTotal = Math.max(0, cartTotal - discountAmount);

  return { appliedCoupon, discountAmount, finalTotal, status, errorMsg, validateCoupon, clearCoupon };
}
