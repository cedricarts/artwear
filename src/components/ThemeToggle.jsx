import { useTheme } from "../hooks/useTheme";
import styles from "../styles/ThemeToggle.module.css";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={styles.toggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      aria-pressed={!isDark}
    >
      <span className={`${styles.knob} ${isDark ? styles.knobDark : styles.knobLight}`}>
        {isDark ? "🌙" : "☀️"}
      </span>
    </button>
  );
}
