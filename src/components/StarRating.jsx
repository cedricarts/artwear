export default function StarRating({ value = 0, size = 16, interactive = false, onChange }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div style={{ display: "inline-flex", gap: 2 }}>
      {stars.map((star) => {
        const fillPercent = Math.max(0, Math.min(1, value - (star - 1))) * 100;
        return (
          <span
            key={star}
            onClick={interactive ? () => onChange?.(star) : undefined}
            style={{ position: "relative", width: size, height: size, cursor: interactive ? "pointer" : "default", display: "inline-block" }}
          >
            <svg width={size} height={size} viewBox="0 0 24 24" style={{ position: "absolute", inset: 0 }}>
              <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 6.9L12 17.3 5.8 20.8l1.6-6.9L2 9.2l7.1-.6z" fill="none" stroke="var(--color-text-muted)" strokeWidth="1" />
            </svg>
            <span style={{ position: "absolute", inset: 0, overflow: "hidden", width: `${fillPercent}%` }}>
              <svg width={size} height={size} viewBox="0 0 24 24">
                <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 6.9L12 17.3 5.8 20.8l1.6-6.9L2 9.2l7.1-.6z" fill="#f0c419" stroke="#f0c419" strokeWidth="1" />
              </svg>
            </span>
          </span>
        );
      })}
    </div>
  );
}
