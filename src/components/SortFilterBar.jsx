import styles from "../styles/SortFilterBar.module.css";

export const SORT_OPTIONS = [
  { value: "newest",     label: "Newest first"    },
  { value: "oldest",     label: "Oldest first"    },
  { value: "price-asc",  label: "Price: Low → High" },
  { value: "price-desc", label: "Price: High → Low" },
  { value: "top-rated",  label: "Top rated"       },
];

export default function SortFilterBar({ sortBy, onSortChange, priceMin, priceMax, onPriceMinChange, onPriceMaxChange, onClearPrice, resultCount, totalCount }) {
  const isPriceFiltered = priceMin !== "" || priceMax !== "";
  return (
    <div className={styles.bar}>
      <div className={styles.sortGroup}>
        <label htmlFor="sort-select" className={styles.label}>Sort</label>
        <select id="sort-select" value={sortBy} onChange={(e) => onSortChange(e.target.value)} className={styles.select}>
          {SORT_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      </div>
      <div className={styles.priceGroup}>
        <span className={styles.label}>Price</span>
        <div className={styles.priceInputs}>
          <div className={styles.priceField}>
            <span className={styles.currencySymbol}>R</span>
            <input type="number" min="0" value={priceMin} onChange={(e) => onPriceMinChange(e.target.value)} placeholder="Min" className={styles.priceInput} aria-label="Minimum price" />
          </div>
          <span className={styles.priceSeparator}>—</span>
          <div className={styles.priceField}>
            <span className={styles.currencySymbol}>R</span>
            <input type="number" min="0" value={priceMax} onChange={(e) => onPriceMaxChange(e.target.value)} placeholder="Max" className={styles.priceInput} aria-label="Maximum price" />
          </div>
        </div>
        {isPriceFiltered && <button onClick={onClearPrice} className={styles.clearPrice}>Clear</button>}
      </div>
      {resultCount < totalCount && <p className={styles.resultCount}>{resultCount} of {totalCount}</p>}
    </div>
  );
}
