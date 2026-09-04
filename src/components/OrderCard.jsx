import { useState }                          from "react";
import { formatPrice }                       from "../utils/currency";
import { formatWhatsAppUrl, printOrderAsPdf } from "../utils/orders";
import OrderStatusBadge                       from "./OrderStatusBadge";
import styles                                 from "../styles/admin/AdminDashboard.module.css";

const STATUS_OPTIONS = ["pending", "processing", "shipped", "delivered", "cancelled"];

const WHATSAPP_SVG_PATH =
  "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148" +
  "-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297" +
  "-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297" +
  "-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497" +
  ".099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579" +
  "-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372" +
  "-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149" +
  ".198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36" +
  ".195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173" +
  "-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 " +
  "01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 " +
  "01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 " +
  "6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 " +
  "9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 " +
  "11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 " +
  "11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 " +
  "11.821 0 00-3.48-8.413z";

export default function OrderCard({ order, inBin = false, onStatusChange, onMoveToBin, onRestore, onHardDelete, onTrackingUpdate }) {
  const shipping   = order.shipping ?? {};
  const name       = shipping.name       ?? "";
  const email      = shipping.email      ?? "";
  const phone      = shipping.phone      ?? "";
  const address    = shipping.address    ?? "";
  const city       = shipping.city       ?? "";
  const postalCode = shipping.postalCode ?? "";
  const orderItems = order.items         ?? [];

  const whatsappUrl = formatWhatsAppUrl(phone);
  const cardId      = `order-card-${order.id}`;
  const shortId     = order.id.slice(0, 8).toUpperCase();

  const createdDateStr = order.createdAt
    ? order.createdAt.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })
    : "—";
  const deletedDateStr = order.deletedAt ? order.deletedAt.toLocaleDateString("en-ZA") : null;

  return (
    <div id={cardId} className={`${styles.orderCard} ${inBin ? styles.binCard : ""}`}>
      <div className={styles.orderMeta}>
        <div className={styles.orderMetaLeft}>
          <p className={styles.orderId}>#{shortId}</p>
          <p className={styles.orderDate}>{createdDateStr}</p>
          {inBin && deletedDateStr && <p className={styles.deletedDate}>Deleted {deletedDateStr}</p>}
        </div>
        <div className={styles.orderMetaRight}>
          <OrderStatusBadge status={order.status} />
          {!inBin && (
            <div className={styles.statusWrapper}>
              <select value={order.status} onChange={(e) => onStatusChange(order.id, e.target.value)} className={`${styles.statusSelect} ${styles[order.status] ?? ""}`}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className={styles.shipping}>
        <p className={styles.customerName}>{name}</p>
        <p className={styles.customerDetail}>{email}</p>
        {whatsappUrl && (
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={styles.whatsappLink}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={WHATSAPP_SVG_PATH} /></svg>
            {phone}
          </a>
        )}
        <p className={styles.customerDetail}>
          {address}{address && city ? ", " : ""}{city}{city && postalCode ? ", " : ""}{postalCode}
        </p>
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
      </div>

      <div className={styles.items}>
        {orderItems.map((item, i) => (
          <div key={i} className={styles.lineItem}>
            <span className={styles.itemName}>
              {item.name}
              {(item.color || item.size) && <span className={styles.itemVariant}> — {[item.color, item.size].filter(Boolean).join(" / ")}</span>}
            </span>
            <span className={styles.itemQty}>× {item.quantity}</span>
            <span className={styles.itemTotal}>{formatPrice(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>

      {order.coupon && (
        <div className={styles.couponRow}>
          <span>Coupon: <strong>{order.coupon.code}</strong>{order.coupon.type === "percentage" && <span> ({order.coupon.value}% off)</span>}</span>
          <span className={styles.couponDiscount}>− {formatPrice(order.coupon.discountAmount)}</span>
        </div>
      )}

      <div className={styles.orderFooter}>
        <div className={styles.orderTotal}><span>Total</span><span>{formatPrice(order.total)}</span></div>
        <div className={styles.orderActions}>
          {inBin ? (
            <>
              <button onClick={() => onRestore(order)} className={styles.restoreBtn}>Restore</button>
              <button onClick={() => onHardDelete(order)} className={styles.hardDeleteBtn}>Delete Forever</button>
            </>
          ) : (
            <>
              <button onClick={() => printOrderAsPdf(cardId, `ArtWear-Order-${shortId}`)} className={styles.pdfBtn}>PDF</button>
              <button onClick={() => onMoveToBin(order)} className={styles.binBtn}>Move to Bin</button>
            </>
          )}
        </div>
      </div>

      {!inBin && onTrackingUpdate && (
        <div className={styles.trackingSection}>
          <TrackingInput orderId={order.id} currentNumber={order.trackingNumber ?? ""} currentUrl={order.trackingUrl ?? ""} onSave={onTrackingUpdate} />
        </div>
      )}
    </div>
  );
}

function TrackingInput({ orderId, currentNumber, currentUrl, onSave }) {
  const [open,   setOpen]   = useState(false);
  const [number, setNumber] = useState(currentNumber);
  const [url,    setUrl]    = useState(currentUrl);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(orderId, number, url);
    setSaving(false);
    setOpen(false);
  };

  if (!open) {
    return <button onClick={() => setOpen(true)} className={styles.trackingToggle}>{currentNumber ? `Tracking: ${currentNumber}` : "+ Add tracking number"}</button>;
  }

  return (
    <div className={styles.trackingForm}>
      <input type="text" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Tracking number" className={styles.trackingFormInput} />
      <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Tracking URL (optional)" className={styles.trackingFormInput} />
      <div className={styles.trackingFormActions}>
        <button onClick={handleSave} disabled={saving} className={styles.trackingSaveBtn}>{saving ? "Saving..." : "Save"}</button>
        <button onClick={() => setOpen(false)} className={styles.trackingCancelBtn}>Cancel</button>
      </div>
    </div>
  );
}
