import styles from "../styles/SearchBar.module.css";

export default function SearchBar({ value, onChange, onClear }) {
  return (
    <div className={styles.wrapper}>
      <input
        type="text" value={value} onChange={(e) => onChange(e.target.value)}
        placeholder="Search products..." className={styles.input} aria-label="Search products"
      />
      {value && (
        <button onClick={onClear} className={styles.clearBtn} aria-label="Clear search">✕</button>
      )}
    </div>
  );
}
