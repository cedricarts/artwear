import { useState } from "react";
import { shareProduct } from "../utils/sharing";
import styles from "../styles/ShareButton.module.css";

export default function ShareButton({ product }) {
  const [feedback, setFeedback] = useState(null);

  const handleClick = async () => {
    const result = await shareProduct(product);
    if (result === "copied") {
      setFeedback("Link copied!");
      setTimeout(() => setFeedback(null), 2000);
    }
  };

  return (
    <div className={styles.wrapper}>
      <button onClick={handleClick} className={styles.btn} aria-label="Share product">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
          <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" /><line x1="15.4" y1="6.5" x2="8.6" y2="10.5" />
        </svg>
        Share
      </button>
      {feedback && <span className={styles.feedback}>{feedback}</span>}
    </div>
  );
}
