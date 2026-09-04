import { useState, useEffect, useCallback } from "react";
import { Link }                             from "react-router-dom";
import { collection, getDocs, orderBy, query, updateDoc, addDoc, doc, serverTimestamp } from "firebase/firestore";
import { db }            from "../../firebase/firebase";
import { useAuth }       from "../../hooks/useAuth";
import GarmentPreview    from "../../components/GarmentPreview";
import OrderStatusBadge  from "../../components/OrderStatusBadge";
import styles            from "../../styles/admin/AdminDesignRequests.module.css";

const COLOUR_NAMES = {
  "#f5f5f5": "White", "#111111": "Black", "#f0ead6": "Cream",
  "#9e9e9e": "Grey", "#c4b9a8": "Stone", "#1a2744": "Navy",
  "#556b2f": "Olive", "#6e1423": "Burgundy", "#5c3d2e": "Brown",
};

const TEMPLATE_LABELS = {
  tshirt: "T-Shirt", hoodie: "Hoodie", crewneck: "Crewneck",
  trackpants: "Track Pants", trousers: "Trousers", cap: "Cap", totebag: "Tote Bag", hat: "Hat",
};

export default function AdminDesignRequests() {
  const { logout } = useAuth();

  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("pending");

  const [approving,     setApproving]     = useState(null);
  const [approvePrice,  setApprovePrice]  = useState("");
  const [approveError,  setApproveError]  = useState(null);
  const [savingApprove, setSavingApprove] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const q    = query(collection(db, "designRequests"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() })));
    } catch (err) {
      console.error("Failed to fetch design requests:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleReject = async (request) => {
    if (!window.confirm(`Reject this design request from ${request.displayName}?`)) return;
    try {
      await updateDoc(doc(db, "designRequests", request.id), { status: "rejected" });
      setRequests((prev) => prev.map((r) => (r.id === request.id ? { ...r, status: "rejected" } : r)));
    } catch (err) {
      console.error("Reject failed:", err);
    }
  };

  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    if (!approvePrice || isNaN(parseFloat(approvePrice))) { setApproveError("Please enter a valid price."); return; }

    setSavingApprove(true);
    setApproveError(null);

    try {
      const req  = approving;
      const c    = req.customisation;
      const name = ["Custom", TEMPLATE_LABELS[c.template] ?? c.template, "—", COLOUR_NAMES[c.stripeColor] ?? "Custom Colour"].join(" ");

      await addDoc(collection(db, "products"), {
        name, price: parseFloat(approvePrice),
        description: `One-of-one custom design by ${req.displayName}.${req.notes ? ` Notes: ${req.notes}` : ""}`,
        imageUrl: "", images: [],
        tags: ["custom", "1-of-1", c.template],
        productType: "custom", isOneOfOne: true, remaining: 1, soldOut: false,
        designRequestId: req.id, customisation: c, createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "designRequests", req.id), { status: "approved" });

      setRequests((prev) => prev.map((r) => (r.id === req.id ? { ...r, status: "approved" } : r)));
      setApproving(null);
      setApprovePrice("");
    } catch (err) {
      console.error("Approve failed:", err);
      setApproveError("Failed to approve. Please try again.");
    } finally {
      setSavingApprove(false);
    }
  };

  const filtered = requests.filter((r) => filter === "all" ? true : r.status === filter);

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
        <div className={styles.pageHeader}>
          <h1 className={styles.heading}>Custom Design Requests</h1>
          <div className={styles.filterRow}>
            {["all", "pending", "approved", "rejected"].map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ""}`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
                <span className={styles.filterCount}>{f === "all" ? requests.length : requests.filter((r) => r.status === f).length}</span>
              </button>
            ))}
          </div>
        </div>

        {loading && <p className={styles.empty}>Loading...</p>}
        {!loading && filtered.length === 0 && <p className={styles.empty}>No {filter === "all" ? "" : filter} requests.</p>}

        <div className={styles.requestGrid}>
          {filtered.map((request) => {
            const c = request.customisation ?? {};
            return (
              <div key={request.id} className={styles.requestCard}>
                <div className={styles.cardHeader}>
                  <div>
                    <p className={styles.requestId}>#{request.id.slice(0, 8).toUpperCase()}</p>
                    <p className={styles.requestFrom}>{request.displayName} · {request.email}</p>
                    <p className={styles.requestDate}>{request.createdAt ? request.createdAt.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }) : "—"}</p>
                  </div>
                  <OrderStatusBadge status={request.status} />
                </div>

                <div className={styles.previewWrapper}>
                  <GarmentPreview template={c.template} garmentColor={c.garmentColor ?? "#111111"} stripeColor={c.stripeColor} />
                </div>

                <div className={styles.designSummary}>
                  <div className={styles.summaryRow}><span className={styles.summaryKey}>Garment</span><span>{TEMPLATE_LABELS[c.template] ?? c.template}</span></div>
                  <div className={styles.summaryRow}><span className={styles.summaryKey}>Garment colour</span><span>{c.garmentColorLabel ?? c.garmentColor}</span></div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryKey}>Stripe</span>
                    <span className={styles.colourPreview}>
                      <span className={styles.colourDot} style={{ backgroundColor: c.stripeColor }} />
                      {COLOUR_NAMES[c.stripeColor] ?? c.stripeColor}
                    </span>
                  </div>
                  {request.notes && (
                    <div className={styles.notesRow}>
                      <span className={styles.summaryKey}>Notes</span>
                      <p className={styles.notesText}>{request.notes}</p>
                    </div>
                  )}
                </div>

                {request.status === "pending" && (
                  <div className={styles.cardActions}>
                    <button onClick={() => { setApproving(request); setApprovePrice(""); setApproveError(null); }} className={styles.approveBtn}>Approve & List</button>
                    <button onClick={() => handleReject(request)} className={styles.rejectBtn}>Reject</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {approving && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Approve & List Product</h2>
            <p className={styles.modalSub}>Set a price for this one-of-one. A product will be created and listed on the storefront.</p>
            <form onSubmit={handleApproveSubmit} className={styles.modalForm}>
              <div className={styles.modalField}>
                <label className={styles.label}>Price (ZAR)</label>
                <input type="number" min="0" step="0.01" value={approvePrice} onChange={(e) => setApprovePrice(e.target.value)} className={styles.input} placeholder="e.g. 1299.00" autoFocus required />
              </div>
              {approveError && <p className={styles.error}>{approveError}</p>}
              <div className={styles.modalActions}>
                <button type="submit" className={styles.approveBtn} disabled={savingApprove}>{savingApprove ? "Creating..." : "Confirm & Create Product"}</button>
                <button type="button" onClick={() => setApproving(null)} className={styles.cancelBtn}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
