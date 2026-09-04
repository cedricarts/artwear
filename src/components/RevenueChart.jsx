import { useState }    from "react";
import { formatPrice } from "../utils/currency";
import styles          from "../styles/RevenueChart.module.css";

const CHART_HEIGHT = 120;
const BAR_WIDTH    = 24;
const BAR_GAP      = 6;
const LABEL_HEIGHT = 28;
const TOTAL_HEIGHT = CHART_HEIGHT + LABEL_HEIGHT;
const CHART_WIDTH  = 14 * (BAR_WIDTH + BAR_GAP) - BAR_GAP;

export default function RevenueChart({ data }) {
  const [hovered, setHovered] = useState(null);
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <div className={styles.wrapper}>
      <div className={styles.chartContainer}>
        <svg viewBox={`0 0 ${CHART_WIDTH} ${TOTAL_HEIGHT}`} preserveAspectRatio="xMidYMid meet" className={styles.svg} aria-label="Revenue over the last 14 days">
          {data.map((day, i) => {
            const barHeight  = (day.revenue / maxRevenue) * CHART_HEIGHT;
            const x          = i * (BAR_WIDTH + BAR_GAP);
            const y          = CHART_HEIGHT - barHeight;
            const isHovered  = hovered === i;
            const hasRevenue = day.revenue > 0;
            return (
              <g key={i}>
                <rect x={x} y={0} width={BAR_WIDTH} height={CHART_HEIGHT} fill="var(--color-surface-2)" rx={3} />
                {hasRevenue && (
                  <rect x={x} y={y} width={BAR_WIDTH} height={barHeight} fill={isHovered ? "var(--color-accent)" : "#555"} rx={3} style={{ transition: "fill 0.15s ease" }} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} />
                )}
                {!hasRevenue && (
                  <rect x={x} y={0} width={BAR_WIDTH} height={CHART_HEIGHT} fill="transparent" onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} />
                )}
                {i % 2 === 0 && (
                  <text x={x + BAR_WIDTH / 2} y={CHART_HEIGHT + 18} textAnchor="middle" fontSize="8" fill="var(--color-text-muted)">
                    {day.label.split(" ")[0]}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        {hovered !== null && (
          <div className={styles.tooltip} style={{ left: `${(hovered * (BAR_WIDTH + BAR_GAP) + BAR_WIDTH / 2) / CHART_WIDTH * 100}%` }}>
            <p className={styles.tooltipDate}>{data[hovered].label}</p>
            <p className={styles.tooltipRevenue}>{formatPrice(data[hovered].revenue)}</p>
            <p className={styles.tooltipOrders}>{data[hovered].count} {data[hovered].count === 1 ? "order" : "orders"}</p>
          </div>
        )}
      </div>
    </div>
  );
}
