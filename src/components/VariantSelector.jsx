import styles from "../styles/VariantSelector.module.css";
import { getAvailableColors, getAvailableSizes, findVariant, isVariantInStock } from "../utils/variants";

export default function VariantSelector({ variants, selectedColor, selectedSize, onColorSelect, onSizeSelect }) {
  if (!variants || variants.length === 0) return null;

  const availableColors = getAvailableColors(variants);
  const availableSizes  = selectedColor ? getAvailableSizes(variants, selectedColor) : [];

  return (
    <div className={styles.wrapper}>
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.label}>Colour</span>
          {selectedColor && <span className={styles.selectedValue}>{selectedColor}</span>}
        </div>
        <div className={styles.colorRow}>
          {availableColors.map(({ color, colorHex }) => (
            <button
              key={color} type="button"
              onClick={() => { onColorSelect(color); onSizeSelect(null); }}
              className={`${styles.colorSwatch} ${selectedColor === color ? styles.colorSwatchActive : ""}`}
              style={{ backgroundColor: colorHex }}
              aria-label={color} aria-pressed={selectedColor === color} title={color}
            />
          ))}
        </div>
      </div>

      {selectedColor && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.label}>Size</span>
            {selectedSize && <span className={styles.selectedValue}>{selectedSize}</span>}
          </div>
          <div className={styles.sizeRow}>
            {availableSizes.map((size) => {
              const variant    = findVariant(variants, selectedColor, size);
              const inStock    = isVariantInStock(variant);
              const isSelected = selectedSize === size;
              return (
                <button
                  key={size} type="button"
                  onClick={() => { if (!inStock) return; onSizeSelect(size); }}
                  disabled={!inStock}
                  className={`${styles.sizeChip} ${isSelected ? styles.sizeChipSelected : ""} ${!inStock ? styles.sizeChipOutOfStock : ""}`}
                  aria-pressed={isSelected}
                  aria-label={inStock ? `Size ${size}` : `Size ${size} — out of stock`}
                >
                  {size}
                  {inStock && variant && (
                    <span className={`${styles.stockDot} ${variant.stock <= 3 ? styles.stockDotLow : styles.stockDotOk}`} />
                  )}
                </button>
              );
            })}
          </div>
          {selectedSize && (() => {
            const v = findVariant(variants, selectedColor, selectedSize);
            if (!v || v.stock > 5) return null;
            return <p className={styles.lowStockWarning}>{v.stock === 1 ? "Only 1 left in this size" : `Only ${v.stock} left in this size`}</p>;
          })()}
        </div>
      )}

      <button type="button" className={styles.sizeGuide}>Size guide →</button>
    </div>
  );
}
