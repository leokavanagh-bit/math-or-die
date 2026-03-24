import styles from './ActionButton.module.css'

export default function ActionButton({ label, icon, color, isActive, onClick, disabled, locked = false }) {
  return (
    <button
      className={`${styles.button} ${isActive ? styles.active : ''} ${locked ? styles.locked : ''}`}
      style={isActive ? { borderColor: color, boxShadow: `0 0 12px ${color}` } : {}}
      onClick={onClick}
      disabled={disabled || locked}
    >
      <span className={styles.icon}>{icon}</span>
      <span className={styles.label}>{label}</span>
      {locked && <span className={styles.lockBadge}>🔒</span>}
    </button>
  )
}
