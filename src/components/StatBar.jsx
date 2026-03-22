import styles from './StatBar.module.css'

export default function StatBar({ value, color, label }) {
  const filled = Math.min(15, Math.max(0, value))
  return (
    <div className={styles.statBar}>
      {label && <span className={styles.label}>{label}</span>}
      <div className={styles.slots}>
        {Array.from({ length: 15 }, (_, i) => (
          <div
            key={i}
            className={`${styles.slot} slot ${i < filled ? `${styles.filled} filled` : ''}`}
            style={i < filled ? { background: color } : {}}
          />
        ))}
      </div>
    </div>
  )
}
