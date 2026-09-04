import { useState }   from "react";
import { WAVE_PATHS } from "../config/garments";
import styles         from "../styles/GarmentPreview.module.css";

export default function GarmentPreview({ template = "tshirt", garmentColor = "#111111", stripeColor = "#f5f5f5", photoUrl }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const waveDef = WAVE_PATHS[template] ?? WAVE_PATHS.tshirt;

  return (
    <div className={styles.wrapper}>
      <div className={styles.photoContainer} style={{ backgroundColor: garmentColor }}>
        {photoUrl && (
          <img src={photoUrl} alt="Garment preview" className={styles.photo} style={{ opacity: imgLoaded ? 1 : 0 }} onLoad={() => setImgLoaded(true)} />
        )}
        {!imgLoaded && <div className={styles.skeleton} style={{ backgroundColor: garmentColor }} />}
        <svg viewBox={waveDef.viewBox} preserveAspectRatio="none" className={styles.waveOverlay} aria-hidden="true">
          {waveDef.paths.map((d, i) => (
            <path key={i} d={d} fill="none" stroke={stripeColor} strokeWidth={waveDef.strokeWidth} strokeLinecap="round" opacity={i % 2 === 0 ? 1 : 0.75} />
          ))}
        </svg>
      </div>
    </div>
  );
}
