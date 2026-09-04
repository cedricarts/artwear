import { useState, useCallback } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase/firebase";

function startOfDay(date) { const d = new Date(date); d.setHours(0,0,0,0); return d; }
function startOfWeek() { const d = startOfDay(new Date()); d.setDate(d.getDate() - d.getDay()); return d; }
function startOfMonth() { const d = startOfDay(new Date()); d.setDate(1); return d; }
function daysAgo(n) { const d = startOfDay(new Date()); d.setDate(d.getDate() - n); return d; }
function toDate(value) { if (!value) return null; if (value.toDate) return value.toDate(); return new Date(value); }

export function useAnalytics() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordersSnap, productsSnap, usersSnap] = await Promise.all([
        getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc"))),
        getDocs(collection(db, "products")),
        getDocs(query(collection(db, "users"), orderBy("createdAt", "desc"))),
      ]);

      const orders   = ordersSnap.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: toDate(d.data().createdAt) }));
      const products = productsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const users    = usersSnap.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: toDate(d.data().createdAt) }));

      const activeOrders = orders.filter((o) => o.status !== "cancelled" && !o.deleted);

      const now        = new Date();
      const weekStart   = startOfWeek();
      const monthStart  = startOfMonth();

      const totalRevenue = activeOrders.reduce((sum, o) => sum + (o.total ?? 0), 0);

      const ordersThisWeek  = activeOrders.filter((o) => o.createdAt && o.createdAt >= weekStart);
      const ordersThisMonth = activeOrders.filter((o) => o.createdAt && o.createdAt >= monthStart);

      const revenueThisWeek  = ordersThisWeek.reduce((sum, o) => sum + (o.total ?? 0), 0);
      const revenueThisMonth = ordersThisMonth.reduce((sum, o) => sum + (o.total ?? 0), 0);

      const avgOrderValue = activeOrders.length > 0 ? totalRevenue / activeOrders.length : 0;

      const last14Days = Array.from({ length: 14 }, (_, i) => {
        const d = daysAgo(13 - i);
        return { date: d, label: d.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric" }), revenue: 0, count: 0 };
      });

      activeOrders.forEach((order) => {
        if (!order.createdAt) return;
        const orderDay = startOfDay(order.createdAt).getTime();
        const bucket    = last14Days.find((b) => b.date.getTime() === orderDay);
        if (bucket) { bucket.revenue += order.total ?? 0; bucket.count += 1; }
      });

      const productFrequency = {};
      activeOrders.forEach((order) => {
        (order.items ?? []).forEach((item) => {
          if (!productFrequency[item.id]) {
            productFrequency[item.id] = { id: item.id, name: item.name, count: 0, revenue: 0 };
          }
          productFrequency[item.id].count   += item.quantity;
          productFrequency[item.id].revenue += item.price * item.quantity;
        });
      });

      const topProducts = Object.values(productFrequency).sort((a, b) => b.count - a.count).slice(0, 5);

      const LOW_STOCK_THRESHOLD = 5;
      const lowStockAlerts = [];
      const outOfStock     = [];

      products.forEach((product) => {
        if (product.soldOut) { outOfStock.push({ id: product.id, name: product.name }); return; }
        const variants = product.variants ?? [];
        if (variants.length === 0) {
          if (product.remaining !== undefined && product.remaining <= LOW_STOCK_THRESHOLD && product.remaining > 0) {
            lowStockAlerts.push({ id: product.id, name: product.name, variant: null, stock: product.remaining });
          }
          return;
        }
        variants.forEach((v) => {
          if (v.stock <= 0) return;
          if (v.stock <= LOW_STOCK_THRESHOLD) {
            lowStockAlerts.push({ id: product.id, name: product.name, variant: `${v.color} / ${v.size}`, stock: v.stock });
          }
        });
      });

      lowStockAlerts.sort((a, b) => a.stock - b.stock);

      const newCustomers = users.filter((u) => u.role !== "admin" && u.createdAt && u.createdAt >= monthStart).length;

      const statusCounts = orders.reduce((acc, o) => {
        const status = o.status ?? "unknown";
        acc[status] = (acc[status] ?? 0) + 1;
        return acc;
      }, {});

      setData({
        totalRevenue, totalOrders: activeOrders.length, avgOrderValue,
        revenueThisWeek, ordersThisWeekCount: ordersThisWeek.length,
        revenueThisMonth, ordersThisMonthCount: ordersThisMonth.length,
        newCustomers, revenueByDay: last14Days, topProducts,
        lowStockAlerts, outOfStock, statusCounts, computedAt: now,
      });
    } catch (err) {
      console.error("Analytics fetch failed:", err);
      setError("Failed to load analytics. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchAnalytics };
}
