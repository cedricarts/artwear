import { Link }           from "react-router-dom";
import { useCart }        from "../hooks/useCart";
import { formatPrice }    from "../utils/currency";
import styles             from "../styles/CartPage.module.css";

export default function CartPage() {
  const { items, cartTotal, removeFromCart, updateQuantity } = useCart();

  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Your cart is empty.</p>
        <Link to="/" className={styles.shopLink}>Continue shopping →</Link>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <div className={styles.itemsCol}>
        <h1 className={styles.heading}>Your Cart</h1>
        <div className={styles.items}>
          {items.map((item) => (
            <div key={`${item.id}-${item.variantId}`} className={styles.row}>
              <Link to={`/product/${item.id}`}>
                <div className={styles.thumb}>{item.imageUrl && <img src={item.imageUrl} alt={item.name} />}</div>
              </Link>
              <div className={styles.details}>
                <Link to={`/product/${item.id}`}><p className={styles.name}>{item.name}</p></Link>
                {(item.size || item.color) && <p className={styles.variantDetail}>{[item.color, item.size].filter(Boolean).join(" / ")}</p>}
                <p className={styles.unitPrice}>{formatPrice(item.price)} each</p>
              </div>
              <div className={styles.mobileRow}>
                <div className={styles.quantityControls}>
                  <button className={styles.qtyBtn} onClick={() => updateQuantity(item.id, item.variantId, item.quantity - 1)} aria-label="Decrease quantity">−</button>
                  <input type="number" min="1" value={item.quantity} onChange={(e) => updateQuantity(item.id, item.variantId, parseInt(e.target.value, 10) || 1)} className={styles.qtyInput} aria-label={`Quantity for ${item.name}`} />
                  <button className={styles.qtyBtn} onClick={() => updateQuantity(item.id, item.variantId, item.quantity + 1)} aria-label="Increase quantity">+</button>
                </div>
                <p className={styles.lineTotal}>{formatPrice(item.price * item.quantity)}</p>
                <button className={styles.removeBtn} onClick={() => removeFromCart(item.id, item.variantId)} aria-label={`Remove ${item.name}`}>✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <aside className={styles.summary}>
        <h2 className={styles.summaryHeading}>Order Summary</h2>
        <div className={styles.summaryRow}><span>Subtotal</span><span>{formatPrice(cartTotal)}</span></div>
        <div className={styles.summaryTotal}><span>Total</span><span>{formatPrice(cartTotal)}</span></div>
        <Link to="/checkout" className={styles.checkoutBtn}>Proceed to Checkout</Link>
        <Link to="/" className={styles.continueLink}>← Continue shopping</Link>
      </aside>
    </div>
  );
}
