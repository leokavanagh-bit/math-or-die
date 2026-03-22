import styles from './ActionButton.module.css'

export default function ActionButton({ label, icon, color, isActive, onClick, disabled }) {
  return (
    <button
      className={`${styles.button} ${isActive ? styles.active : ''}`}
      style={isActive ? { borderColor: color, boxShadow: `0 0 12px ${color}` } : {}}
      onClick={onClick}
      disabled={disabled}
    >
      <span className={styles.icon}>{icon}</span>
      <span className={styles.label}>{label}</span>
    </button>
  )
}
