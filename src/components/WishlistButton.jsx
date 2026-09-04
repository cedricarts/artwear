import { useWishlist } from "../hooks/useWishlist";
import { useAuth }     from "../hooks/useAuth";
import styles          from "../styles/WishlistButton.module.css";

export default function WishlistButton({ product, size = "sm" }) {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { currentUser } = useAuth();
  const active = isWishlisted(product.id);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) { window.location.href = "/login"; return; }
    toggleWishlist(product);
  };

  return (
    <button onClick={handleClick} className={`${styles.btn} ${styles[size]} ${active ? styles.active : ""}`} aria-label={active ? "Remove from wishlist" : "Add to wishlist"} aria-pressed={active}>
      <svg width={size === "lg" ? 22 : 16} height={size === "lg" ? 22 : 16} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
        <path d="M12 21s-7.5-4.5-9.5-9C1.2 8.5 2.8 5 6.5 5 8.7 5 10.7 6.2 12 8c1.3-1.8 3.3-3 5.5-3 3.7 0 5.3 3.5 4 7-2 4.5-9.5 9-9.5 9z" />
      </svg>
    </button>
  );
}
