import { useState }    from "react";
import { formatPrice } from "../utils/currency";
import styles          from "../styles/CouponInput.module.css";

export default function CouponInput({ onValidate, onClear, status, errorMsg, appliedCoupon, discountAmount }) {
  const [inputCode, setInputCode] = useState("");
  const isApplied = status === "valid" && appliedCoupon;
  const isLoading = status === "loading";

  const handleApply = () => { if (inputCode.trim()) onValidate(inputCode); };
  const handleRemove = () => { setInputCode(""); onClear(); };
  const handleKeyDown = (e) => { if (e.key === "Enter") { e.preventDefault(); handleApply(); } };

  return (
    <div className={styles.wrapper}>
      <p className={styles.label}>Coupon code</p>
      <div className={styles.inputRow}>
        <input
          type="text"
          value={isApplied ? appliedCoupon.code : inputCode.toUpperCase()}
          onChange={(e) => !isApplied && setInputCode(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter code"
          className={`${styles.input} ${isApplied ? styles.applied : ""}`}
          readOnly={isApplied}
          aria-label="Coupon code"
          maxLength={32}
        />
        {isApplied ? (
          <button type="button" onClick={handleRemove} className={styles.removeBtn}>Remove</button>
        ) : (
          <button type="button" onClick={handleApply} className={styles.applyBtn} disabled={isLoading || !inputCode.trim()}>
            {isLoading ? "..." : "Apply"}
          </button>
        )}
      </div>
      {status === "error" && errorMsg && <p className={styles.error} role="alert">{errorMsg}</p>}
      {isApplied && (
        <p className={styles.success}>
          {appliedCoupon.type === "percentage" ? `${appliedCoupon.value}% discount` : `Fixed discount`} applied — saving {formatPrice(discountAmount)}
        </p>
      )}
    </div>
  );
}
