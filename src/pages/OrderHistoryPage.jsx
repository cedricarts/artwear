import { useState, useEffect, useCallback } from "react";
import { Link }                             from "react-router-dom";
import { collection, getDocs, orderBy, query, where, updateDoc, doc } from "firebase/firestore";
import { db }            from "../firebase/firebase";
import { useAuth }       from "../hooks/useAuth";
import { formatPrice }   from "../utils/currency";
import OrderStatusBadge  from "../components/OrderStatusBadge";
import styles            from "../styles/OrderHistoryPage.module.css";

export default function OrderHistoryPage() {
  const { currentUser } = useAuth();
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [expanded, setExpanded] = useState(new Set());

  const fetchOrders = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, "orders"), where("uid", "==", currentUser.uid), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() })));
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setError("Could not load your orders. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const toggleExpanded = (orderId) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(orderId) ? next.delete(orderId) : next.add(orderId);
      return next;
    });
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Cancel this order? This cannot be undone.")) return;
    try {
      await updateDoc(doc(db, "orders", orderId), { status: "cancelled" });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: "cancelled" } : o)));
    } catch (err) {
      console.error("Cancel failed:", err);
    }
  };

  if (!currentUser) {
    return (
      <div className={styles.gate}>
        <h1 className={styles.heading}>Order History</h1>
        <p className={styles.gateMsg}><Link to="/login" className={styles.gateLink}>Sign in</Link> to view your orders.</p>
      </div>
    );
  }

  if (loading) return <div className={styles.status}><p>Loading your orders...</p></div>;

  if (error) {
    return (
      <div className={styles.status}>
        <p className={styles.errorText}>{error}</p>
        <button onClick={fetchOrders} className={styles.retryBtn}>Try again</button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className={styles.empty}>
        <h1 className={styles.heading}>Order History</h1>
        <p className={styles.emptyMsg}>You haven't placed any orders yet.</p>
        <Link to="/" className={styles.shopLink}>Browse the shop →</Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.heading}>Order History</h1>
        <div className={styles.headerRight}>
          <span className={styles.count}>{orders.length} {orders.length === 1 ? "order" : "orders"}</span>
          <button onClick={fetchOrders} className={styles.refreshBtn} disabled={loading}>Refresh</button>
        </div>
      </div>

      <div className={styles.orders}>
        {orders.map((order) => {
          const isOpen = expanded.has(order.id);
          return (
            <div key={order.id} className={styles.orderCard}>
              <div className={styles.cardHeader}>
                <div className={styles.orderInfo}>
                  <p className={styles.orderId}>#{order.id.slice(0, 8).toUpperCase()}</p>
                  <p className={styles.orderDate}>{order.createdAt ? order.createdAt.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" }) : "—"}</p>
                </div>
                <div className={styles.cardMeta}>
                  <OrderStatusBadge status={order.status} />
                  <span className={styles.orderTotal}>{formatPrice(order.total)}</span>
                </div>
              </div>

              <div className={styles.shippingRow}>
                <span className={styles.shippingLabel}>Ship to</span>
                <span className={styles.shippingValue}>{order.shipping?.name} — {order.shipping?.address}, {order.shipping?.city}</span>
              </div>

              <button className={styles.toggleBtn} onClick={() => toggleExpanded(order.id)} aria-expanded={isOpen}>
                {isOpen ? "Hide items ↑" : `View items (${order.items?.length ?? 0}) ↓`}
              </button>

              {isOpen && (
                <div className={styles.lineItems}>
                  {order.items?.map((item, i) => (
                    <div key={i} className={styles.lineItem}>
                      <Link to={`/product/${item.id}`} className={styles.itemName}>
                        {item.name}
                        {(item.color || item.size) && <span className={styles.itemVariant}> — {[item.color, item.size].filter(Boolean).join(" / ")}</span>}
                      </Link>
                      <span className={styles.itemQty}>× {item.quantity}</span>
                      <span className={styles.itemTotal}>{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}

                  {order.coupon && (
                    <div className={styles.couponRow}>
                      <span className={styles.couponLabel}>Coupon ({order.coupon.code}){order.coupon.type === "percentage" && ` — ${order.coupon.value}% off`}</span>
                      <span className={styles.couponDiscount}>− {formatPrice(order.coupon.discountAmount)}</span>
                    </div>
                  )}

                  {order.coupon && order.subtotal && (
                    <div className={styles.subtotalRow}><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
                  )}

                  <div className={styles.itemsTotal}><span>Order total</span><span>{formatPrice(order.total)}</span></div>

                  {order.trackingNumber && (
                    <div className={styles.trackingRow}>
                      <span className={styles.trackingLabel}>Tracking</span>
                      {order.trackingUrl ? (
                        <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className={styles.trackingLink}>{order.trackingNumber} →</a>
                      ) : (
                        <span className={styles.trackingNumber}>{order.trackingNumber}</span>
                      )}
                    </div>
                  )}

                  {order.status === "delivered" && (
                    <div className={styles.reviewPrompt}>
                      <p className={styles.reviewPromptText}>How was your order?</p>
                      <div className={styles.reviewPromptLinks}>
                        {order.items?.map((item, i) => (
                          <Link key={i} to={`/product/${item.id}#reviews`} className={styles.reviewPromptLink}>Review {item.name} →</Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {order.status === "pending" && (
                <button className={styles.cancelOrderBtn} onClick={() => handleCancelOrder(order.id)}>Cancel Order</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
