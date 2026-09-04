import { useState, useEffect } from "react";
import { Link }                from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db }            from "../firebase/firebase";
import { useAuth }       from "../hooks/useAuth";
import { useProducts }   from "../hooks/useProducts";
import ProductCard       from "../components/ProductCard";
import styles            from "../styles/WishlistPage.module.css";

export default function WishlistPage() {
  const { currentUser }   = useAuth();
  const { products }      = useProducts();
  const [wishlistedIds, setWishlistedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) { setLoading(false); return; }
    const fetchWishlist = async () => {
      try {
        const snap = await getDocs(collection(db, "wishlists", currentUser.uid, "items"));
        setWishlistedIds(snap.docs.map((d) => d.id));
      } catch (err) {
        console.error("Failed to fetch wishlist:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className={styles.gate}>
        <h1 className={styles.heading}>Wishlist</h1>
        <p className={styles.gateMsg}><Link to="/login" className={styles.gateLink}>Sign in</Link> to view your wishlist.</p>
      </div>
    );
  }

  if (loading) return <div className={styles.status}><p>Loading...</p></div>;

  const wishlistedProducts = products.filter((p) => wishlistedIds.includes(p.id));

  if (wishlistedProducts.length === 0) {
    return (
      <div className={styles.empty}>
        <h1 className={styles.heading}>Wishlist</h1>
        <p className={styles.emptyMsg}>Your wishlist is empty.</p>
        <Link to="/" className={styles.shopLink}>Browse the shop →</Link>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.heading}>Wishlist</h1>
        <span className={styles.count}>{wishlistedProducts.length} saved</span>
      </div>
      <div className={styles.grid}>
        {wishlistedProducts.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </div>
  );
}
