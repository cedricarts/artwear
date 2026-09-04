import styles from "../styles/OrderStatusBadge.module.css";

const STATUS_LABELS = {
  pending: "Pending", processing: "Processing", shipped: "Shipped",
  delivered: "Delivered", cancelled: "Cancelled", rejected: "Rejected",
  produced: "Produced", approved: "Approved",
};

export default function OrderStatusBadge({ status }) {
  const label = STATUS_LABELS[status] ?? status;
  return <span className={`${styles.badge} ${styles[status] ?? styles.pending}`}>{label}</span>;
}
