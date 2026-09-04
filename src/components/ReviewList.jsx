import StarRating from "./StarRating";
import styles     from "../styles/ReviewList.module.css";

export default function ReviewList({ reviews, loading }) {
  if (loading) return <p className={styles.empty}>Loading reviews...</p>;
  if (reviews.length === 0) return <p className={styles.empty}>No reviews yet. Be the first!</p>;

  return (
    <div className={styles.list}>
      {reviews.map((review) => (
        <div key={review.id} className={styles.review}>
          <div className={styles.header}>
            {review.photoURL ? (
              <img src={review.photoURL} alt={review.displayName} className={styles.avatar} referrerPolicy="no-referrer" />
            ) : (
              <div className={styles.avatarFallback}>{(review.displayName ?? "?")[0].toUpperCase()}</div>
            )}
            <div className={styles.meta}>
              <p className={styles.name}>{review.displayName}</p>
              <p className={styles.date}>
                {review.createdAt ? review.createdAt.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }) : ""}
              </p>
            </div>
            <StarRating value={review.rating} size={14} />
          </div>
          <p className={styles.comment}>{review.comment}</p>
        </div>
      ))}
    </div>
  );
}
