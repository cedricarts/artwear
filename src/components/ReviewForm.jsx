import { useState } from "react";
import { useAuth }  from "../hooks/useAuth";
import StarRating   from "./StarRating";
import styles       from "../styles/ReviewForm.module.css";

export default function ReviewForm({ onSubmit, submitting }) {
  const { currentUser } = useAuth();
  const [rating,  setRating]  = useState(0);
  const [comment, setComment] = useState("");
  const [error,   setError]   = useState(null);
  const [success, setSuccess] = useState(false);

  if (!currentUser) {
    return (
      <div className={styles.gate}>
        <p className={styles.gateMsg}>
          <a href="/login" className={styles.gateLink}>Sign in</a> to leave a review.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (rating === 0) { setError("Please select a star rating."); return; }
    if (!comment.trim()) { setError("Please write a short review."); return; }
    try {
      await onSubmit({ rating, comment });
      setRating(0); setComment(""); setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Failed to submit review. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h3 className={styles.heading}>Write a review</h3>
      <div className={styles.field}>
        <label className={styles.label}>Your rating</label>
        <StarRating value={rating} size={24} interactive onChange={setRating} />
      </div>
      <div className={styles.field}>
        <label htmlFor="comment" className={styles.label}>Your review</label>
        <textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} rows={4} placeholder="Share your thoughts about this product..." className={styles.textarea} maxLength={500} />
      </div>
      {error   && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>Review submitted — thank you!</p>}
      <button type="submit" className={styles.submitBtn} disabled={submitting}>
        {submitting ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}
