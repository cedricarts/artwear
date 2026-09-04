import { Link }              from "react-router-dom";
import { useCart }           from "../hooks/useCart";
import { formatPrice }       from "../utils/currency";
import { getProductImages }  from "../pages/admin/AdminProducts";
import { useRecentlyViewed } from "../hooks/useRecentlyViewed";
import WishlistButton        from "./WishlistButton";
import StarRating            from "./StarRating";
import styles                from "../styles/ProductCard.module.css";

export default function ProductCard({ product, isNew = false, compact = false }) {
  const { addToCart }         = useCart();
  const { addRecentlyViewed } = useRecentlyViewed();
  const images                = getProductImages(product);
  const primaryImage          = images[0] ?? null;
  const hasVariants           = product.variants && product.variants.length > 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasVariants) {
      window.location.href = `/product/${product.id}`;
      return;
    }
    addToCart(product, null);
  };

  const handleCardClick = () => { addRecentlyViewed(product.id); };

  return (
    <Link
      to={`/product/${product.id}`}
      className={`${styles.card} ${compact ? styles.cardCompact : ""}`}
      onClick={handleCardClick}
    >
      {/* Image sits in its own sunken "well" inset from the card edge —
          this is the piece that makes the neumorphic language read:
          raised outer shell, pressed inner frame. */}
      <div className={styles.imageFrame}>
        {primaryImage ? (
          <img src={primaryImage} alt={product.name} className={styles.image} loading="lazy" />
        ) : (
          <div className={styles.imagePlaceholder} />
        )}

        <div className={styles.wishlistSlot}><WishlistButton product={product} /></div>

        {isNew && <span className={styles.newBadge}>New</span>}

        {(product.soldOut || product.isOneOfOne || product.productType === "limited") && (
          <div className={styles.badgeOverlay}>
            {product.soldOut && <span className={styles.soldOutBadge}>Sold Out</span>}
            {!product.soldOut && product.isOneOfOne && <span className={styles.oneOfOneBadge}>1 of 1</span>}
            {!product.soldOut && product.productType === "limited" && (product.remaining ?? 0) > 0 && (
              <span className={styles.limitedBadge}>{product.remaining} left</span>
            )}
          </div>
        )}

        {images.length > 1 && <div className={styles.imageCountBadge}>{images.length} photos</div>}
      </div>

      {!compact && (
        <div className={styles.info}>
          <div className={styles.meta}>
            <span className={styles.name}>{product.name}</span>
            {(product.reviewCount ?? 0) > 0 && (
              <div className={styles.cardRating}>
                <StarRating value={product.avgRating ?? 0} size={11} />
                <span className={styles.cardRatingText}>{(product.avgRating ?? 0).toFixed(1)}</span>
              </div>
            )}
          </div>

          <div className={styles.priceRow}>
            <span className={styles.price}>{formatPrice(product.price)}</span>
            <button
              className={`${styles.fab} ${product.soldOut ? styles.fabDisabled : ""}`}
              onClick={handleAddToCart}
              disabled={product.soldOut}
              aria-label={product.soldOut ? `${product.name} is sold out` : hasVariants ? `View options for ${product.name}` : `Add ${product.name} to cart`}
            >
              {product.soldOut ? "×" : hasVariants ? "···" : "+"}
            </button>
          </div>
        </div>
      )}

      {compact && (
        <div className={styles.infoCompact}>
          <span className={styles.nameCompact}>{product.name}</span>
          <span className={styles.priceCompact}>{formatPrice(product.price)}</span>
        </div>
      )}
    </Link>
  );
}
