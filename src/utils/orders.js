import { formatPrice } from "./currency";

export function formatWhatsAppUrl(phone) {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) {
    digits = "27" + digits.slice(1);
  } else if (!digits.startsWith("27")) {
    digits = "27" + digits;
  }
  return `https://wa.me/${digits}`;
}

export function printOrderAsPdf(elementId, filename) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const style = document.createElement("style");
  style.id    = "print-override";
  style.innerHTML = `
    @media print {
      body > * { display: none !important; }
      #${elementId} { display: block !important; }
      #${elementId} * { display: revert !important; }
      @page { margin: 20mm; size: A4; }
    }
  `;
  document.head.appendChild(style);

  const prevTitle  = document.title;
  document.title   = filename;
  window.print();
  document.title = prevTitle;
  document.head.removeChild(style);
}

export function printAllOrdersAsPdf(orders, filename = "ArtWear-Orders") {
  const html = orders.map((order) => `
    <div style="page-break-after: always; padding: 8mm 0; font-family: Arial, sans-serif; font-size: 12px; color: #111;">
      <div style="border-bottom: 1px solid #ddd; padding-bottom: 6px; margin-bottom: 12px;">
        <strong style="font-size: 14px;">ARTWEAR</strong>
        <span style="float: right; font-size: 11px; color: #555;">Order Receipt</span>
      </div>
      <table style="width: 100%; margin-bottom: 12px;">
        <tr>
          <td><strong>Order</strong></td>
          <td>#${order.id.slice(0, 8).toUpperCase()}</td>
          <td><strong>Date</strong></td>
          <td>${order.createdAt ? order.createdAt.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" }) : "—"}</td>
        </tr>
        <tr>
          <td><strong>Status</strong></td>
          <td style="text-transform: capitalize;">${order.status}</td>
          <td><strong>Currency</strong></td>
          <td>ZAR</td>
        </tr>
      </table>
      <div style="margin-bottom: 12px;">
        <strong>Customer</strong>
        <div style="margin-top: 4px; color: #333;">
          ${order.shipping?.name ?? ""}<br/>
          ${order.shipping?.email ?? ""}<br/>
          ${order.shipping?.phone ? `WhatsApp: ${order.shipping.phone}<br/>` : ""}
          ${order.shipping?.address ?? ""}, ${order.shipping?.city ?? ""}, ${order.shipping?.postalCode ?? ""}
        </div>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
        <thead>
          <tr style="border-bottom: 1px solid #ddd;">
            <th style="text-align: left; padding: 4px 0; font-size: 11px; color: #555;">Item</th>
            <th style="text-align: center; padding: 4px 0; font-size: 11px; color: #555;">Qty</th>
            <th style="text-align: right; padding: 4px 0; font-size: 11px; color: #555;">Unit</th>
            <th style="text-align: right; padding: 4px 0; font-size: 11px; color: #555;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${(order.items ?? []).map((item) => `
            <tr style="border-bottom: 1px solid #f0f0f0;">
              <td style="padding: 4px 0;">${item.name}${(item.color || item.size) ? ` (${[item.color, item.size].filter(Boolean).join(" / ")})` : ""}</td>
              <td style="text-align: center; padding: 4px 0;">${item.quantity}</td>
              <td style="text-align: right; padding: 4px 0;">${formatPrice(item.price)}</td>
              <td style="text-align: right; padding: 4px 0;">${formatPrice(item.price * item.quantity)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      ${order.coupon ? `
        <div style="text-align: right; font-size: 11px; color: #555; margin-bottom: 4px;">
          Subtotal: ${formatPrice(order.subtotal ?? order.total)}<br/>
          Coupon (${order.coupon.code}): -${formatPrice(order.coupon.discountAmount)}
        </div>
      ` : ""}
      ${order.trackingNumber ? `
        <div style="font-size: 11px; color: #555; margin-bottom: 4px;">
          Tracking: ${order.trackingNumber}
        </div>
      ` : ""}
      <div style="text-align: right; font-weight: bold; font-size: 13px; border-top: 1px solid #ddd; padding-top: 6px;">
        Total: ${formatPrice(order.total)}
      </div>
    </div>
  `).join("");

  const container = document.createElement("div");
  container.id    = "print-all-orders";
  container.style.cssText = "position:absolute;left:-9999px;top:0;";
  container.innerHTML     = html;
  document.body.appendChild(container);

  const style = document.createElement("style");
  style.id    = "print-all-override";
  style.innerHTML = `
    @media print {
      body > * { display: none !important; }
      #print-all-orders { display: block !important; position: static !important; left: 0 !important; }
      @page { margin: 15mm; size: A4; }
    }
  `;
  document.head.appendChild(style);

  const prevTitle = document.title;
  document.title  = filename;
  window.print();
  document.title = prevTitle;
  document.head.removeChild(style);
  document.body.removeChild(container);
}
