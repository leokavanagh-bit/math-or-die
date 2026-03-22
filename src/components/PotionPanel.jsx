import styles from './PotionPanel.module.css'

const POTION_CONFIG = [
  { type: 'attack', label: 'ATK', icon: '⚔️', color: '#e74c3c' },
  { type: 'shield', label: 'DEF', icon: '🛡️', color: '#3498db' },
  { type: 'magic', label: 'MGC', icon: '✨', color: '#9b59b6' },
  { type: 'aura', label: 'AUR', icon: '🌟', color: '#f39c12' },
  { type: 'slow', label: 'SLW', icon: '🐢', color: '#1abc9c' },
  { type: 'heal', label: 'HEL', icon: '💚', color: '#27ae60' },
]

export default function PotionPanel({ potions, onUse, disabled }) {
  return (
    <div className={styles.panel}>
      {POTION_CONFIG.map(({ type, label, icon, color }) => {
        const count = potions[type]
        const isEmpty = count === 0
        return (
          <button
            key={type}
            className={`${styles.potion} ${isEmpty ? styles.empty : ''}`}
            style={!isEmpty ? { borderColor: color } : {}}
            onClick={() => !isEmpty && onUse(type)}
            disabled={isEmpty || disabled}
          >
            <span className={styles.potionIcon}>{icon}</span>
            <span className={styles.potionLabel}>{label}</span>
            <span className={styles.potionCount}>{count}</span>
          </button>
        )
      })}
    </div>
  )
}
