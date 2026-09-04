import { useState, useEffect }                from "react";
import { useNavigate, Link }                  from "react-router-dom";
import { collection, doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db }               from "../firebase/firebase";
import { useCart }          from "../hooks/useCart";
import { useAuth }          from "../hooks/useAuth";
import { useCoupon }        from "../hooks/useCoupon";
import { useSavedAddresses} from "../hooks/useSavedAddresses";
import { formatPrice }      from "../utils/currency";
import CouponInput          from "../components/CouponInput";
import styles               from "../styles/CheckoutPage.module.css";

const EMPTY_FORM = { name: "", email: "", phone: "", address: "", city: "", postalCode: "" };

export default function CheckoutPage() {
  const { items, cartTotal, clearCart } = useCart();
  const { currentUser }                 = useAuth();
  const navigate                        = useNavigate();

  const { appliedCoupon, discountAmount, finalTotal, status: couponStatus, errorMsg: couponError, validateCoupon, clearCoupon } = useCoupon(cartTotal);
  const { addresses, defaultAddress, saveAddress } = useSavedAddresses();

  const [form,             setForm]             = useState(EMPTY_FORM);
  const [submitting,       setSubmitting]       = useState(false);
  const [error,            setError]            = useState(null);
  const [selectedAddressId,setSelectedAddressId]= useState(null);
  const [saveThisAddress,  setSaveThisAddress]  = useState(false);
  const [addressLabel,     setAddressLabel]     = useState("Home");

  useEffect(() => {
    if (defaultAddress && !selectedAddressId) {
      setForm({
        name: defaultAddress.name ?? "", email: defaultAddress.email ?? "", phone: defaultAddress.phone ?? "",
        address: defaultAddress.address ?? "", city: defaultAddress.city ?? "", postalCode: defaultAddress.postalCode ?? "",
      });
      setSelectedAddressId(defaultAddress.id);
    }
  }, [defaultAddress]);

  if (!currentUser) {
    return (
      <div className={styles.authGate}>
        <h2 className={styles.authGateTitle}>Sign in to checkout</h2>
        <p className={styles.authGateMsg}>You need an account to place an order.</p>
        <Link to="/login" state={{ from: "/checkout" }} className={styles.authGateBtn}>Sign In / Create Account</Link>
        <Link to="/cart" className={styles.authGateBack}>← Back to cart</Link>
      </div>
    );
  }

  if (items.length === 0) { navigate("/cart"); return null; }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await runTransaction(db, async (transaction) => {
        let couponSnap = null;
        if (appliedCoupon) couponSnap = await transaction.get(doc(db, "coupons", appliedCoupon.code));

        const stockReads = [];
        for (const item of items) {
          const productRef  = doc(db, "products", item.id);
          const productSnap = await transaction.get(productRef);
          stockReads.push({ item, productRef, productSnap });
        }

        if (appliedCoupon) {
          if (!couponSnap.exists()) throw new Error("Coupon no longer exists.");
          const { usedCount, maxUses } = couponSnap.data();
          if (maxUses > 0 && usedCount >= maxUses) throw new Error("This coupon has just reached its usage limit.");
        }

        for (const { item, productSnap } of stockReads) {
          if (!productSnap.exists()) continue;
          const data     = productSnap.data();
          const variants = data.variants ?? [];
          if (variants.length === 0) {
            const { remaining, soldOut } = data;
            if (remaining === undefined) continue;
            if (soldOut || remaining <= 0) throw new Error(`"${item.name}" is sold out.`);
            continue;
          }
          if (!item.variantId || item.variantId === "no-variant") continue;
          const variant = variants.find((v) => v.id === item.variantId);
          if (!variant) throw new Error(`The selected variant of "${item.name}" no longer exists.`);
          if (variant.stock < item.quantity) {
            throw new Error(
              variant.stock === 0
                ? `"${item.name}" (${item.color} / ${item.size}) is sold out.`
                : `Only ${variant.stock} unit${variant.stock === 1 ? "" : "s"} of "${item.name}" (${item.color} / ${item.size}) remaining.`
            );
          }
        }

        if (appliedCoupon && couponSnap) {
          const { usedCount } = couponSnap.data();
          transaction.update(doc(db, "coupons", appliedCoupon.code), { usedCount: usedCount + 1 });
        }

        for (const { item, productRef, productSnap } of stockReads) {
          if (!productSnap.exists()) continue;
          const data     = productSnap.data();
          const variants = data.variants ?? [];
          if (variants.length === 0) {
            const { remaining } = data;
            if (remaining === undefined) continue;
            const newRemaining = remaining - item.quantity;
            transaction.update(productRef, { remaining: Math.max(0, newRemaining), soldOut: newRemaining <= 0 });
            continue;
          }
          if (!item.variantId || item.variantId === "no-variant") continue;
          const updatedVariants = variants.map((v) => v.id === item.variantId ? { ...v, stock: Math.max(0, v.stock - item.quantity) } : v);
          const allSoldOut = updatedVariants.every((v) => v.stock <= 0);
          transaction.update(productRef, { variants: updatedVariants, soldOut: allSoldOut });
        }

        const orderRef = doc(collection(db, "orders"));
        transaction.set(orderRef, {
          shipping: { name: form.name, email: form.email, phone: form.phone, address: form.address, city: form.city, postalCode: form.postalCode },
          items: items.map(({ id, name, price, quantity, variantId, size, color }) => ({
            id, name, price, quantity, variantId: variantId ?? null, size: size ?? null, color: color ?? null,
          })),
          subtotal: cartTotal, total: finalTotal, currency: "ZAR", status: "pending", deleted: false,
          uid: currentUser.uid, userEmail: currentUser.email, createdAt: serverTimestamp(),
          ...(appliedCoupon && { coupon: { code: appliedCoupon.code, type: appliedCoupon.type, value: appliedCoupon.value, discountAmount } }),
        });
      });

      if (saveThisAddress && currentUser) {
        await saveAddress({ ...form, label: addressLabel }, addresses.length === 0);
      }

      clearCart();
      navigate("/order-success");
    } catch (err) {
      console.error("Order submission failed:", err);
      setError(err.message ?? "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.layout}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h1 className={styles.heading}>Shipping Information</h1>

        {addresses.length > 0 && (
          <div className={styles.savedAddresses}>
            <p className={styles.savedLabel}>Saved addresses</p>
            <div className={styles.addressCards}>
              {addresses.map((addr) => (
                <button key={addr.id} type="button" onClick={() => {
                  setSelectedAddressId(addr.id);
                  setForm({ name: addr.name ?? "", email: addr.email ?? "", phone: addr.phone ?? "", address: addr.address ?? "", city: addr.city ?? "", postalCode: addr.postalCode ?? "" });
                }} className={`${styles.addressCard} ${selectedAddressId === addr.id ? styles.addressCardActive : ""}`}>
                  <span className={styles.addressCardLabel}>{addr.label ?? "Address"}</span>
                  <span className={styles.addressCardDetail}>{addr.address}, {addr.city}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={styles.fieldGroup}>
          <Field label="Full Name" name="name" value={form.name} onChange={handleChange} required />
          <Field label="Email Address" name="email" type="email" value={form.email} onChange={handleChange} required />
        </div>

        <Field label="WhatsApp Number" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="e.g. 0821234567" required />
        <Field label="Street Address" name="address" value={form.address} onChange={handleChange} required />

        <div className={styles.fieldGroup}>
          <Field label="City" name="city" value={form.city} onChange={handleChange} required />
          <Field label="Postal Code" name="postalCode" value={form.postalCode} onChange={handleChange} required />
        </div>

        {currentUser && (
          <div className={styles.saveAddressRow}>
            <label className={styles.saveAddressLabel}>
              <input type="checkbox" checked={saveThisAddress} onChange={(e) => setSaveThisAddress(e.target.checked)} className={styles.saveAddressCheckbox} />
              Save this address
            </label>
            {saveThisAddress && (
              <select value={addressLabel} onChange={(e) => setAddressLabel(e.target.value)} className={styles.addressLabelSelect}>
                <option value="Home">Home</option><option value="Work">Work</option><option value="Other">Other</option>
              </select>
            )}
          </div>
        )}

        {error && <p className={styles.error} role="alert">{error}</p>}

        <button type="submit" className={styles.submitBtn} disabled={submitting}>
          {submitting ? "Placing Order..." : `Place Order — ${formatPrice(finalTotal)}`}
        </button>
      </form>

      <aside className={styles.summary}>
        <h2 className={styles.summaryHeading}>Order Summary</h2>
        {items.map((item) => (
          <div key={`${item.id}-${item.variantId}`} className={styles.summaryRow}>
            <span>
              {item.name}
              {(item.color || item.size) && <span className={styles.summaryVariant}> ({[item.color, item.size].filter(Boolean).join(" / ")})</span>}
              {" "}<span className={styles.muted}>× {item.quantity}</span>
            </span>
            <span>{formatPrice(item.price * item.quantity)}</span>
          </div>
        ))}
        <div className={styles.summaryRow}><span>Subtotal</span><span>{formatPrice(cartTotal)}</span></div>
        {discountAmount > 0 && (
          <div className={`${styles.summaryRow} ${styles.discountRow}`}>
            <span>Discount{appliedCoupon?.type === "percentage" && ` (${appliedCoupon.value}%)`}</span>
            <span className={styles.discountAmount}>− {formatPrice(discountAmount)}</span>
          </div>
        )}
        <div className={styles.summaryTotal}><span>Total</span><span>{formatPrice(finalTotal)}</span></div>
        <CouponInput onValidate={validateCoupon} onClear={clearCoupon} status={couponStatus} errorMsg={couponError} appliedCoupon={appliedCoupon} discountAmount={discountAmount} />
      </aside>
    </div>
  );
}

function Field({ label, name, type = "text", value, onChange, required, placeholder }) {
  return (
    <div className={styles.field}>
      <label htmlFor={name} className={styles.label}>{label}</label>
      <input id={name} name={name} type={type} value={value} onChange={onChange} required={required} placeholder={placeholder} className={styles.input} autoComplete={name} />
    </div>
  );
}
