import styles from "../styles/TagFilter.module.css";

export default function TagFilter({ allTags, activeTags, onToggle, onClear }) {
  if (allTags.length === 0) return null;
  return (
    <div className={styles.wrapper}>
      {allTags.map((tag) => (
        <button key={tag} onClick={() => onToggle(tag)} className={`${styles.tag} ${activeTags.has(tag) ? styles.tagActive : ""}`}>
          {tag}
        </button>
      ))}
      {activeTags.size > 0 && <button onClick={onClear} className={styles.clearBtn}>Clear tags</button>}
    </div>
  );
}
