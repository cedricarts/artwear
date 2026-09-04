import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import styles from "../styles/HomeCarousel.module.css";

const AUTO_ADVANCE_MS = 5000;

export default function HomeCarousel({ slides = [] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef(null);
  const count = slides.length;

  const goTo = useCallback((i) => setIndex(((i % count) + count) % count), [count]);
  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    if (paused || count <= 1) return;
    const t = setTimeout(next, AUTO_ADVANCE_MS);
    return () => clearTimeout(t);
  }, [index, paused, next, count]);

  if (count === 0) return null;

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) (delta < 0 ? next() : prev());
    touchStartX.current = null;
  };

  return (
    <div
      className={styles.carousel}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className={styles.track} style={{ transform: `translateX(-${index * 100}%)` }}>
        {slides.map((slide) => (
          <Link key={slide.id} to={slide.to || "/"} className={styles.slide}>
            <img src={slide.image} alt={slide.title ?? ""} className={styles.image} />
            {(slide.title || slide.subtitle) && (
              <div className={styles.caption}>
                {slide.title && <h3 className={styles.slideTitle}>{slide.title}</h3>}
                {slide.subtitle && <p className={styles.slideSubtitle}>{slide.subtitle}</p>}
              </div>
            )}
          </Link>
        ))}
      </div>

      {count > 1 && (
        <>
          <button type="button" className={`${styles.arrow} ${styles.arrowLeft}`} onClick={prev} aria-label="Previous slide">‹</button>
          <button type="button" className={`${styles.arrow} ${styles.arrowRight}`} onClick={next} aria-label="Next slide">›</button>
          <div className={styles.dots}>
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                className={`${styles.dot} ${i === index ? styles.dotActive : ""}`}
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
