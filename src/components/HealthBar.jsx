import styles from './HealthBar.module.css'

export default function HealthBar({ value, flipped = false }) {
  const filled = Math.min(20, Math.max(0, value))
  const segments = Array.from({ length: 20 }, (_, i) => i < filled)
  if (flipped) segments.reverse()

  return (
    <div className={styles.healthBar}>
      {segments.map((isFilled, i) => (
        <div
          key={i}
          className={`${styles.segment} segment ${isFilled ? `${styles.filled} filled` : ''}`}
        />
      ))}
    </div>
  )
}
