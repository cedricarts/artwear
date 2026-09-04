export function formatPrice(amount) {
  const value = typeof amount === "number" ? amount : parseFloat(amount) || 0;
  return new Intl.NumberFormat("en-ZA", {
    style:    "currency",
    currency: "ZAR",
  }).format(value);
}
