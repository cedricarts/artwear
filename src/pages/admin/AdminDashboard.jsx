import { useState, useEffect, useCallback } from "react";
import { Link }                             from "react-router-dom";
import { collection, getDocs, orderBy, query, where, updateDoc, deleteDoc, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db }              from "../../firebase/firebase";
import { useAuth }         from "../../hooks/useAuth";
import { formatPrice }     from "../../utils/currency";
import { printAllOrdersAsPdf } from "../../utils/orders";
import OrderCard           from "../../components/OrderCard";
import styles              from "../../styles/admin/AdminDashboard.module.css";

const EMPTY_COUPON = { code: "", type: "percentage", value: "", minOrder: "", maxUses: "", expiresAt: "" };

export default function AdminDashboard() {
  const { logout } = useAuth();

  const [activeTab, setActiveTab] = useState("orders");

  const [orders,        setOrders]        = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError,   setOrdersError]   = useState(null);

  const [binOrders,  setBinOrders]  = useState([]);
  const [binLoading, setBinLoading] = useState(false);
  const [binFetched, setBinFetched] = useState(false);

  const [coupons,       setCoupons]       = useState([]);
  const [couponsLoading,setCouponsLoading]= useState(true);
  const [couponForm,    setCouponForm]    = useState(EMPTY_COUPON);
  const [couponError,   setCouponError]   = useState(null);
  const [couponSuccess, setCouponSuccess] = useState(null);
  const [savingCoupon,  setSavingCoupon]  = useState(false);

  const [lowStockCount, setLowStockCount] = useState(0);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const q = query(collection(db, "orders"), where("deleted", "!=", true), orderBy("deleted"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() })));
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setOrdersError("Failed to load orders.");
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const fetchBin = useCallback(async () => {
    setBinLoading(true);
    try {
      const q = query(collection(db, "orders"), where("deleted", "==", true), orderBy("deletedAt", "desc"));
      const snap = await getDocs(q);
      setBinOrders(snap.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate(), deletedAt: d.data().deletedAt?.toDate() })));
      setBinFetched(true);
    } catch (err) {
      console.error("Failed to fetch bin:", err);
    } finally {
      setBinLoading(false);
    }
  }, []);

  const fetchCoupons = useCallback(async () => {
    setCouponsLoading(true);
    try {
      const snap = await getDocs(collection(db, "coupons"));
      setCoupons(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Failed to fetch coupons:", err);
    } finally {
      setCouponsLoading(false);
    }
  }, []);

  const fetchLowStockCount = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, "products"));
      let count = 0;
      snap.docs.forEach((d) => {
        const data     = d.data();
        const variants = data.variants ?? [];
        if (variants.length > 0) {
          variants.forEach((v) => { if (v.stock > 0 && v.stock <= 5) count++; });
        } else if (data.remaining !== undefined && data.remaining > 0 && data.remaining <= 5) {
          count++;
        }
      });
      setLowStockCount(count);
    } catch (err) {
      console.error("Low stock check failed:", err);
    }
  }, []);

  useEffect(() => { fetchOrders(); fetchCoupons(); fetchLowStockCount(); }, [fetchOrders, fetchCoupons, fetchLowStockCount]);
  useEffect(() => { if (activeTab === "bin" && !binFetched) fetchBin(); }, [activeTab, binFetched, fetchBin]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    } catch (err) {
      console.error("Status update failed:", err);
    }
  };

  const handleTrackingUpdate = async (orderId, trackingNumber, trackingUrl) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { trackingNumber: trackingNumber.trim(), trackingUrl: trackingUrl.trim() || null });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, trackingNumber, trackingUrl } : o)));
    } catch (err) {
      console.error("Tracking update failed:", err);
    }
  };

  const handleMoveToBin = async (order) => {
    if (!window.confirm(`Move order #${order.id.slice(0, 8).toUpperCase()} to bin?`)) return;
    try {
      await updateDoc(doc(db, "orders", order.id), { deleted: true, deletedAt: serverTimestamp() });
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      setBinFetched(false);
    } catch (err) {
      console.error("Move to bin failed:", err);
    }
  };

  const handleRestore = async (order) => {
    try {
      await updateDoc(doc(db, "orders", order.id), { deleted: false, deletedAt: null });
      setBinOrders((prev) => prev.filter((o) => o.id !== order.id));
      fetchOrders();
    } catch (err) {
      console.error("Restore failed:", err);
    }
  };

  const handleHardDelete = async (order) => {
    if (!window.confirm(`Permanently delete order #${order.id.slice(0, 8).toUpperCase()}? This cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, "orders", order.id));
      setBinOrders((prev) => prev.filter((o) => o.id !== order.id));
    } catch (err) {
      console.error("Hard delete failed:", err);
    }
  };

  const handleCouponChange = (e) => {
    const { name, value } = e.target;
    setCouponForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCouponSubmit = async (e) => {
    e.preventDefault();
    setCouponError(null); setCouponSuccess(null); setSavingCoupon(true);

    const code = couponForm.code.trim().toUpperCase();
    if (!code) { setCouponError("Coupon code is required."); setSavingCoupon(false); return; }

    try {
      const existing = await getDoc(doc(db, "coupons", code));
      if (existing.exists()) { setCouponError(`Code "${code}" already exists.`); setSavingCoupon(false); return; }

      await setDoc(doc(db, "coupons", code), {
        code, type: couponForm.type, value: parseFloat(couponForm.value),
        minOrder: couponForm.minOrder ? parseFloat(couponForm.minOrder) : 0,
        maxUses: couponForm.maxUses ? parseInt(couponForm.maxUses, 10) : 0,
        expiresAt: couponForm.expiresAt ? new Date(couponForm.expiresAt) : null,
        usedCount: 0, active: true, createdAt: serverTimestamp(),
      });

      setCouponSuccess(`Coupon "${code}" created.`);
      setCouponForm(EMPTY_COUPON);
      fetchCoupons();
    } catch (err) {
      console.error("Coupon save failed:", err);
      setCouponError("Failed to create coupon.");
    } finally {
      setSavingCoupon(false);
    }
  };

  const handleToggleActive = async (coupon) => {
    try {
      await updateDoc(doc(db, "coupons", coupon.code), { active: !coupon.active });
      setCoupons((prev) => prev.map((c) => (c.id === coupon.id ? { ...c, active: !c.active } : c)));
    } catch (err) {
      console.error("Toggle failed:", err);
    }
  };

  const handleDeleteCoupon = async (coupon) => {
    if (!window.confirm(`Delete coupon "${coupon.code}"?`)) return;
    try {
      await deleteDoc(doc(db, "coupons", coupon.code));
      setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
    } catch (err) {
      console.error("Delete coupon failed:", err);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.adminHeader}>
        <div className={styles.adminNav}>
          <span className={styles.adminTitle}>Admin</span>
          <div className={styles.adminLinks}>
            <Link to="/admin">Dashboard</Link>
            <Link to="/admin/products">Products</Link>
            <Link to="/admin/analytics">Analytics</Link>
            <Link to="/admin/design-requests">Custom Designs</Link>
            <Link to="/admin/home-content">Home Content</Link>
            <Link to="/">← Storefront</Link>
            <button onClick={logout} className={styles.logoutBtn}>Sign Out</button>
          </div>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${activeTab === "orders" ? styles.activeTab : ""}`} onClick={() => setActiveTab("orders")}>
            Orders<span className={styles.tabCount}>{orders.length}</span>
          </button>
          <button className={`${styles.tab} ${activeTab === "coupons" ? styles.activeTab : ""}`} onClick={() => setActiveTab("coupons")}>
            Coupons<span className={styles.tabCount}>{coupons.length}</span>
          </button>
          <button className={`${styles.tab} ${activeTab === "bin" ? styles.activeTab : ""}`} onClick={() => setActiveTab("bin")}>
            Bin{binOrders.length > 0 && <span className={`${styles.tabCount} ${styles.binCount}`}>{binOrders.length}</span>}
          </button>
          {lowStockCount > 0 && <Link to="/admin/analytics" className={styles.stockAlert}>⚠ {lowStockCount} low stock</Link>}
        </div>

        {activeTab === "orders" && (
          <div className={styles.tabContent}>
            <div className={styles.sectionHeader}>
              <h1 className={styles.heading}>Orders</h1>
              <div className={styles.sectionActions}>
                <button onClick={() => printAllOrdersAsPdf(orders, `ArtWear-Orders-${new Date().toISOString().slice(0, 10)}`)} className={styles.exportAllBtn} disabled={orders.length === 0}>Export All PDF</button>
                <button onClick={fetchOrders} className={styles.refreshBtn} disabled={ordersLoading}>{ordersLoading ? "Loading..." : "Refresh"}</button>
              </div>
            </div>
            {ordersError && <p className={styles.error}>{ordersError}</p>}
            {!ordersLoading && orders.length === 0 && <p className={styles.empty}>No orders yet.</p>}
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} inBin={false} onStatusChange={handleStatusChange} onMoveToBin={handleMoveToBin} onRestore={handleRestore} onHardDelete={handleHardDelete} onTrackingUpdate={handleTrackingUpdate} />
            ))}
          </div>
        )}

        {activeTab === "coupons" && (
          <div className={styles.tabContent}>
            <div className={styles.couponLayout}>
              <section className={styles.couponFormPanel}>
                <h2 className={styles.panelHeading}>Create Coupon</h2>
                <form onSubmit={handleCouponSubmit} className={styles.couponForm}>
                  <div className={styles.field}>
                    <label htmlFor="code" className={styles.label}>Code</label>
                    <input id="code" name="code" value={couponForm.code.toUpperCase()} onChange={handleCouponChange} className={styles.input} placeholder="SAVE20" required maxLength={32} />
                  </div>
                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label htmlFor="type" className={styles.label}>Type</label>
                      <select id="type" name="type" value={couponForm.type} onChange={handleCouponChange} className={styles.input}>
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed (ZAR)</option>
                      </select>
                    </div>
                    <div className={styles.field}>
                      <label htmlFor="value" className={styles.label}>{couponForm.type === "percentage" ? "Discount %" : "Discount (R)"}</label>
                      <input id="value" name="value" type="number" min="0" step={couponForm.type === "percentage" ? "1" : "0.01"} max={couponForm.type === "percentage" ? "100" : undefined} value={couponForm.value} onChange={handleCouponChange} className={styles.input} placeholder={couponForm.type === "percentage" ? "20" : "50.00"} required />
                    </div>
                  </div>
                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label htmlFor="minOrder" className={styles.label}>Min order (R)</label>
                      <input id="minOrder" name="minOrder" type="number" min="0" step="0.01" value={couponForm.minOrder} onChange={handleCouponChange} className={styles.input} placeholder="0 = no minimum" />
                    </div>
                    <div className={styles.field}>
                      <label htmlFor="maxUses" className={styles.label}>Max uses</label>
                      <input id="maxUses" name="maxUses" type="number" min="0" step="1" value={couponForm.maxUses} onChange={handleCouponChange} className={styles.input} placeholder="0 = unlimited" />
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="expiresAt" className={styles.label}>Expiry date (optional)</label>
                    <input id="expiresAt" name="expiresAt" type="date" value={couponForm.expiresAt} onChange={handleCouponChange} className={styles.input} />
                  </div>
                  {couponError   && <p className={styles.error}>{couponError}</p>}
                  {couponSuccess && <p className={styles.success}>{couponSuccess}</p>}
                  <button type="submit" className={styles.saveBtn} disabled={savingCoupon}>{savingCoupon ? "Creating..." : "Create Coupon"}</button>
                </form>
              </section>

              <section className={styles.couponListPanel}>
                <h2 className={styles.panelHeading}>All Coupons<span className={styles.tabCount}>{coupons.length}</span></h2>
                {couponsLoading && <p className={styles.empty}>Loading...</p>}
                {!couponsLoading && coupons.length === 0 && <p className={styles.empty}>No coupons yet.</p>}
                <div className={styles.couponList}>
                  {coupons.map((coupon) => (
                    <div key={coupon.id} className={`${styles.couponCard} ${!coupon.active ? styles.inactive : ""}`}>
                      <div className={styles.couponCardHeader}>
                        <div>
                          <p className={styles.couponCode}>{coupon.code}</p>
                          <p className={styles.couponMeta}>
                            {coupon.type === "percentage" ? `${coupon.value}% off` : `${formatPrice(coupon.value)} off`}
                            {coupon.minOrder > 0 && ` · min ${formatPrice(coupon.minOrder)}`}
                          </p>
                        </div>
                        <div className={styles.couponActions}>
                          <button onClick={() => handleToggleActive(coupon)} className={coupon.active ? styles.deactivateBtn : styles.activateBtn}>{coupon.active ? "Deactivate" : "Activate"}</button>
                          <button onClick={() => handleDeleteCoupon(coupon)} className={styles.deleteCouponBtn}>Delete</button>
                        </div>
                      </div>
                      <div className={styles.couponStats}>
                        <span>Uses: {coupon.usedCount}{coupon.maxUses > 0 && ` / ${coupon.maxUses}`}</span>
                        {coupon.expiresAt && <span>Expires: {(coupon.expiresAt.toDate ? coupon.expiresAt.toDate() : new Date(coupon.expiresAt)).toLocaleDateString("en-ZA")}</span>}
                        <span className={coupon.active ? styles.activeTag : styles.inactiveTag}>{coupon.active ? "Active" : "Inactive"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === "bin" && (
          <div className={styles.tabContent}>
            <div className={styles.sectionHeader}>
              <h1 className={styles.heading}>Bin</h1>
              <button onClick={fetchBin} className={styles.refreshBtn} disabled={binLoading}>{binLoading ? "Loading..." : "Refresh"}</button>
            </div>
            <p className={styles.binNotice}>Orders in the bin are not permanently deleted. Use "Delete Forever" to remove completely.</p>
            {binLoading && <p className={styles.empty}>Loading...</p>}
            {!binLoading && binOrders.length === 0 && <p className={styles.empty}>Bin is empty.</p>}
            {binOrders.map((order) => (
              <OrderCard key={order.id} order={order} inBin={true} onStatusChange={handleStatusChange} onMoveToBin={handleMoveToBin} onRestore={handleRestore} onHardDelete={handleHardDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
