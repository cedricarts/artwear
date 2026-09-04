import { useEffect }       from "react";
import { Link }            from "react-router-dom";
import { useAuth }         from "../../hooks/useAuth";
import { useAnalytics }    from "../../hooks/useAnalytics";
import { formatPrice }     from "../../utils/currency";
import RevenueChart        from "../../components/RevenueChart";
import styles              from "../../styles/admin/AdminAnalytics.module.css";

export default function AdminAnalytics() {
  const { logout }                               = useAuth();
  const { data, loading, error, fetchAnalytics } = useAnalytics();

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

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
          <div>
            <h1 className={styles.heading}>Analytics</h1>
            {data?.computedAt && <p className={styles.lastUpdated}>Last updated {data.computedAt.toLocaleTimeString("en-ZA")}</p>}
          </div>
          <button onClick={fetchAnalytics} className={styles.refreshBtn} disabled={loading}>{loading ? "Loading..." : "Refresh"}</button>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {loading && !data && (
          <div className={styles.loadingGrid}>
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className={styles.kpiSkeleton} />)}
          </div>
        )}

        {data && (
          <>
            <div className={styles.kpiGrid}>
              <KpiCard label="Total Revenue" value={formatPrice(data.totalRevenue)} sub={`${formatPrice(data.revenueThisMonth)} this month`} />
              <KpiCard label="Total Orders" value={data.totalOrders.toLocaleString()} sub={`${data.ordersThisMonthCount} this month`} />
              <KpiCard label="Avg Order Value" value={formatPrice(data.avgOrderValue)} sub="across all orders" />
              <KpiCard label="New Customers" value={data.newCustomers.toLocaleString()} sub="this month" />
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionHeading}>Order Status</h2>
              <div className={styles.statusGrid}>
                {Object.entries(data.statusCounts).map(([status, count]) => (
                  <div key={status} className={styles.statusChip}>
                    <span className={`${styles.statusDot} ${styles[status] ?? ""}`} />
                    <span className={styles.statusLabel}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                    <span className={styles.statusCount}>{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionHeading}>Revenue — Last 14 Days<span className={styles.sectionSub}>{formatPrice(data.revenueThisWeek)} this week</span></h2>
              <div className={styles.chartWrapper}><RevenueChart data={data.revenueByDay} /></div>
            </div>

            <div className={styles.twoCol}>
              <div className={styles.section}>
                <h2 className={styles.sectionHeading}>Top Products</h2>
                {data.topProducts.length === 0 ? (
                  <p className={styles.empty}>No order data yet.</p>
                ) : (
                  <div className={styles.topProductsList}>
                    {data.topProducts.map((p, i) => (
                      <div key={p.id} className={styles.topProductRow}>
                        <span className={styles.topProductRank}>#{i + 1}</span>
                        <div className={styles.topProductMeta}>
                          <p className={styles.topProductName}>{p.name}</p>
                          <p className={styles.topProductSub}>{p.count} unit{p.count === 1 ? "" : "s"} sold</p>
                        </div>
                        <span className={styles.topProductRevenue}>{formatPrice(p.revenue)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.section}>
                <h2 className={styles.sectionHeading}>
                  Stock Alerts
                  {(data.lowStockAlerts.length + data.outOfStock.length) > 0 && <span className={styles.alertBadge}>{data.lowStockAlerts.length + data.outOfStock.length}</span>}
                </h2>
                {data.outOfStock.length === 0 && data.lowStockAlerts.length === 0 && <p className={styles.empty}>All products well stocked.</p>}
                {data.outOfStock.map((p) => (
                  <div key={p.id} className={`${styles.alertRow} ${styles.alertDanger}`}>
                    <span className={styles.alertDot} />
                    <div className={styles.alertMeta}><p className={styles.alertName}>{p.name}</p><p className={styles.alertSub}>Sold out</p></div>
                    <Link to="/admin/products" className={styles.alertAction}>Edit →</Link>
                  </div>
                ))}
                {data.lowStockAlerts.map((alert, i) => (
                  <div key={`${alert.id}-${i}`} className={`${styles.alertRow} ${styles.alertWarning}`}>
                    <span className={`${styles.alertDot} ${styles.alertDotWarning}`} />
                    <div className={styles.alertMeta}><p className={styles.alertName}>{alert.name}</p><p className={styles.alertSub}>{alert.variant ? `${alert.variant} — ` : ""}{alert.stock} left</p></div>
                    <Link to="/admin/products" className={styles.alertAction}>Edit →</Link>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub }) {
  return (
    <div className={styles.kpiCard}>
      <p className={styles.kpiLabel}>{label}</p>
      <p className={styles.kpiValue}>{value}</p>
      {sub && <p className={styles.kpiSub}>{sub}</p>}
    </div>
  );
}
