export const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "One Size"];

export function getProductVariants(product) {
  if (!product) return [];
  return Array.isArray(product.variants) ? product.variants : [];
}

export function getAvailableColors(variants) {
  const seen = new Set();
  return variants.reduce((acc, v) => {
    if (!seen.has(v.color)) {
      seen.add(v.color);
      acc.push({ color: v.color, colorHex: v.colorHex });
    }
    return acc;
  }, []);
}

export function getAvailableSizes(variants, selectedColor) {
  const sizes = variants.filter((v) => v.color === selectedColor).map((v) => v.size);
  return SIZE_ORDER.filter((s) => sizes.includes(s));
}

export function findVariant(variants, color, size) {
  return variants.find((v) => v.color === color && v.size === size) ?? null;
}

export function makeVariantId(color, size) {
  return `${color.toLowerCase().replace(/\s+/g, "-")}-${size}`;
}

export function isVariantInStock(variant) {
  return variant !== null && variant.stock > 0;
}

export function isProductSoldOut(variants) {
  if (!variants || variants.length === 0) return false;
  return variants.every((v) => v.stock <= 0);
}

export function getLowStockVariants(variants, threshold = 3) {
  return variants.filter((v) => v.stock > 0 && v.stock <= threshold);
}

export function getTotalStock(variants) {
  return variants.reduce((sum, v) => sum + (v.stock ?? 0), 0);
}

export function buildVariantsFromMatrix(colors, sizes, existingVariants = []) {
  const variants = [];
  for (const { color, colorHex } of colors) {
    for (const size of sizes) {
      const id = makeVariantId(color, size);
      const existing = existingVariants.find((v) => v.id === id);
      variants.push({
        id, color, colorHex, size,
        stock: existing ? existing.stock : 0,
        sku:   existing ? (existing.sku ?? "") : "",
      });
    }
  }
  return variants;
}
