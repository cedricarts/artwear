import { Link } from "react-router-dom";
import styles from "../styles/HomeBanner.module.css";

export default function HomeBanner({ eyebrow, title, subtitle, ctaLabel = "Shop Now", ctaTo = "/" }) {
  if (!title) return null;
  return (
    <div className={styles.banner}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.content}>
        {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
        <h2 className={styles.title}>{title}</h2>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        <Link to={ctaTo || "/"} className={styles.cta}>{ctaLabel}</Link>
      </div>
    </div>
  );
}
