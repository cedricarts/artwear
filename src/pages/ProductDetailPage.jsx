import { useState, useEffect }        from "react";
import { useParams, useNavigate }     from "react-router-dom";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db }                         from "../firebase/firebase";
import { useProducts }                from "../hooks/useProducts";
import { useCart }                    from "../hooks/useCart";
import { useReviews }                 from "../hooks/useReviews";
import { formatPrice }                from "../utils/currency";
import { getProductVariants, findVariant, isVariantInStock } from "../utils/variants";
import { getProductImages }           from "./admin/AdminProducts";
import StarRating                     from "../components/StarRating";
import ReviewForm                     from "../components/ReviewForm";
import ReviewList                     from "../components/ReviewList";
import WishlistButton                 from "../components/WishlistButton";
import ShareButton                    from "../components/ShareButton";
import VariantSelector                from "../components/VariantSelector";
import ProductCard                    from "../components/ProductCard";
import styles                         from "../styles/ProductDetailPage.module.css";

export default function ProductDetailPage() {
  const { id }                = useParams();
  const { products, loading } = useProducts();
  const { addToCart, items }  = useCart();
  const navigate              = useNavigate();

  const { reviews, loading: reviewsLoading, submitting, submitReview } = useReviews(id);

  const [activeIndex,   setActiveIndex]   = useState(0);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize,  setSelectedSize]  = useState(null);
  const [variantError,  setVariantError]  = useState(null);
  const [related,       setRelated]       = useState([]);

  const product     = products.find((p) => p.id === id);
  const variants    = getProductVariants(product ?? {});
  const images      = getProductImages(product);
  const hasVariants = variants.length > 0;

  const selectedVariant = hasVariants && selectedColor && selectedSize
    ? findVariant(variants, selectedColor, selectedSize) : null;

  useEffect(() => {
    setSelectedColor(null); setSelectedSize(null); setVariantError(null); setActiveIndex(0);
  }, [id]);

  useEffect(() => {
    if (!product || !product.tags || product.tags.length === 0) return;
    const fetchRelated = async () => {
      try {
        const q = query(
          collection(db, "products"),
          where("tags", "array-contains-any", product.tags.slice(0, 10)),
          where("soldOut", "!=", true),
          limit(5)
        );
        const snap = await getDocs(q);
        const results = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((p) => p.id !== id).slice(0, 4);
        setRelated(results);
      } catch (err) {
        console.warn("Could not fetch related products:", err);
      }
    };
    fetchRelated();
  }, [product, id]);

  if (loading) return <div className={styles.status}><p>Loading...</p></div>;

  if (!product) {
    return (
      <div className={styles.status}>
        <p>Product not found.</p>
        <button onClick={() => navigate("/")} className={styles.backBtn}>Back to shop</button>
      </div>
    );
  }

  const handleAddToCart = () => {
    setVariantError(null);
    if (hasVariants) {
      if (!selectedColor) { setVariantError("Please select a colour."); return; }
      if (!selectedSize)  { setVariantError("Please select a size."); return; }
      if (!selectedVariant || !isVariantInStock(selectedVariant)) { setVariantError("This combination is out of stock."); return; }
    }
    addToCart(product, selectedVariant);
    navigate("/cart");
  };

  const inCart = items.some((item) => item.id === product.id && (hasVariants ? item.variantId === selectedVariant?.id : true));

  const cartButtonLabel = () => {
    if (product.soldOut) return "Sold Out";
    if (hasVariants) {
      if (!selectedColor) return "Select a Colour";
      if (!selectedSize)  return "Select a Size";
      if (!selectedVariant || !isVariantInStock(selectedVariant)) return "Out of Stock";
    }
    return inCart ? "In Cart — Add Another" : "Add to Cart";
  };

  const cartButtonDisabled = product.soldOut || (hasVariants && (!selectedVariant || !isVariantInStock(selectedVariant)));

  return (
    <div>
      <div className={styles.layout}>
        <div className={styles.imageCol}>
          <div className={styles.heroWrapper}>
            {images.length > 0 ? (
              <img src={images[activeIndex]} alt={`${product.name} — image ${activeIndex + 1}`} className={styles.heroImage} />
            ) : (
              <div className={styles.heroPlaceholder} />
            )}
          </div>
          {images.length > 1 && (
            <div className={styles.thumbnailStrip}>
              {images.map((src, i) => (
                <button key={i} type="button" onClick={() => setActiveIndex(i)} className={`${styles.thumbnail} ${i === activeIndex ? styles.thumbnailActive : ""}`} aria-label={`View image ${i + 1}`}>
                  <img src={src} alt={`${product.name} view ${i + 1}`} loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.infoCol}>
          <button onClick={() => navigate(-1)} className={styles.backLink}>← Back</button>
          <h1 className={styles.name}>{product.name}</h1>
          <div className={styles.metaRow}>
            <p className={styles.price}>{formatPrice(product.price)}</p>
            {(product.reviewCount ?? 0) > 0 && (
              <div className={styles.ratingRow}>
                <StarRating value={product.avgRating ?? 0} size={15} />
                <span className={styles.ratingText}>{(product.avgRating ?? 0).toFixed(1)}<span className={styles.ratingCount}>({product.reviewCount})</span></span>
              </div>
            )}
          </div>

          {(product.tags ?? []).length > 0 && (
            <div className={styles.tags}>{product.tags.map((tag) => <span key={tag} className={styles.tag}>{tag}</span>)}</div>
          )}

          {product.description && <p className={styles.description}>{product.description}</p>}

          <VariantSelector variants={variants} selectedColor={selectedColor} selectedSize={selectedSize} onColorSelect={setSelectedColor} onSizeSelect={setSelectedSize} />

          {variantError && <p className={styles.variantError} role="alert">{variantError}</p>}

          {!hasVariants && !product.soldOut && product.productType !== "standard" && product.remaining !== undefined && (
            <p className={styles.stockStatus}>
              {product.isOneOfOne ? "One of one — never reproduced" : `${product.remaining} unit${product.remaining === 1 ? "" : "s"} remaining`}
            </p>
          )}

          <div className={styles.actions}>
            <button className={`${styles.addButton} ${cartButtonDisabled ? styles.addButtonDisabled : ""}`} onClick={handleAddToCart} disabled={cartButtonDisabled}>
              {cartButtonLabel()}
            </button>
            <div className={styles.secondaryActions}>
              <WishlistButton product={product} size="lg" />
              <ShareButton product={product} />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.reviewsSection}>
        <h2 className={styles.reviewsHeading}>Reviews{(product.reviewCount ?? 0) > 0 && <span className={styles.reviewsCount}>{product.reviewCount}</span>}</h2>
        <div className={styles.reviewsLayout}>
          <div className={styles.reviewFormCol}><ReviewForm onSubmit={submitReview} submitting={submitting} /></div>
          <div className={styles.reviewListCol}><ReviewList reviews={reviews} loading={reviewsLoading} /></div>
        </div>
      </div>

      {related.length > 0 && (
        <div className={styles.relatedSection}>
          <h2 className={styles.relatedHeading}>You may also like</h2>
          <div className={styles.relatedGrid}>{related.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        </div>
      )}
    </div>
  );
}
