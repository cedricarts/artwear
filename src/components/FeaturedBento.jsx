import { Link } from "react-router-dom";
import { formatPrice } from "../utils/currency";
import { getProductImages } from "../pages/admin/AdminProducts";
import styles from "../styles/FeaturedBento.module.css";

/**
 * Renders admin-picked products in a bento layout: first item large
 * (2x2), next two wide (2x1), remainder standard cells. Deliberately
 * NOT the main product grid — see prior conversation on why a
 * dynamically filtered/sorted grid can't carry a stable "hero" cell.
 * This only ever renders a fixed, admin-curated set.
 */
export default function FeaturedBento({ products, heading = "Featured" }) {
  if (!products || products.length === 0) return null;

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.heading}>{heading}</h2>
      <div className={`bentoGrid ${styles.grid}`}>
        {products.map((product, i) => {
          const images = getProductImages(product);
          const image = images[0] ?? null;
          const spanClass = i === 0 ? "bentoLarge" : i === 1 || i === 2 ? "bentoWide" : "";

          return (
            <Link key={product.id} to={`/product/${product.id}`} className={`${styles.tile} ${spanClass}`}>
              {image ? (
                <img src={image} alt={product.name} className={styles.image} loading="lazy" />
              ) : (
                <div className={styles.imagePlaceholder} />
              )}
              <div className={styles.scrim} />
              <div className={styles.tileInfo}>
                <span className={styles.tileName}>{product.name}</span>
                <span className={styles.tilePrice}>{formatPrice(product.price)}</span>
              </div>
              {product.soldOut && <span className={styles.soldOutTag}>Sold Out</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
