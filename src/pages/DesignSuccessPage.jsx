import { Link } from "react-router-dom";
import styles   from "../styles/CheckoutPage.module.css";

export default function DesignSuccessPage() {
  return (
    <div className={styles.successWrapper}>
      <h1 className={styles.successTitle}>Request Received</h1>
      <p className={styles.successMsg}>
        Your custom design request has been submitted. We'll review it and reach out when your one-of-one piece is ready to be listed.
      </p>
      <Link to="/" className={styles.authGateBtn}>Back to Shop</Link>
    </div>
  );
}
