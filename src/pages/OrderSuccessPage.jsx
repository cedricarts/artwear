import { Link } from "react-router-dom";
import styles   from "../styles/CheckoutPage.module.css";

export default function OrderSuccessPage() {
  return (
    <div className={styles.successWrapper}>
      <h1 className={styles.successTitle}>Order Placed</h1>
      <p className={styles.successMsg}>
        Thank you for your order. We'll be in touch via WhatsApp to confirm delivery details closer to dispatch.
      </p>
      <Link to="/orders" className={styles.authGateBtn}>View Order History</Link>
      <Link to="/" className={styles.authGateBack}>← Back to shop</Link>
    </div>
  );
}
