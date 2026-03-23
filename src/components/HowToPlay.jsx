import styles from './HowToPlay.module.css'

const ACTIONS = [
  { icon: '⚔',  name: 'Attack', math: 'Addition',       combat: 'Each point of attack deals 1 damage to the enemy (reduced by their Shield)' },
  { icon: '🛡',  name: 'Shield', math: 'Subtraction',    combat: 'Each point of shield absorbs 1 damage from the enemy\'s Attack' },
  { icon: '✨', name: 'Magic',  math: 'Multiplication', combat: 'Each point of magic deals 1 bonus damage (reduced by their Aura)' },
  { icon: '🌟', name: 'Aura',   math: 'Division',       combat: 'Each point of aura absorbs 1 damage from the enemy\'s Magic' },
]

const POTIONS = [
  { icon: '⚔️', name: 'Attack Potion', effect: '+3 Attack this round' },
  { icon: '🛡️', name: 'Shield Potion', effect: '+3 Shield this round' },
  { icon: '✨', name: 'Magic Potion',  effect: '+3 Magic this round' },
  { icon: '🌟', name: 'Aura Potion',   effect: '+3 Aura this round' },
  { icon: '🐢', name: 'Slow Potion',   effect: 'Slows the enemy for 15 seconds' },
  { icon: '💚', name: 'Heal Potion',   effect: 'Restore 5 HP (max 20)' },
]

export default function HowToPlay({ onClose }) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <h2 className={styles.title}>How to Play</h2>

        <p className={styles.intro}>
          Pick an action, solve a maths problem, and build your stats before time runs out.
          When the timer hits zero, combat resolves — your attack hits the enemy, their attack hits you.
          Survive all the rounds to win!
        </p>

        <h3 className={styles.section}>Action Buttons</h3>
        {ACTIONS.map(a => (
          <div key={a.name} className={styles.row}>
            <span className={styles.icon}>{a.icon}</span>
            <div className={styles.rowBody}>
              <div className={styles.rowName}>{a.name} <span className={styles.math}>— {a.math}</span></div>
              <div className={styles.rowDesc}>{a.combat}</div>
            </div>
          </div>
        ))}

        <h3 className={styles.section}>Potions</h3>
        {POTIONS.map(p => (
          <div key={p.name} className={styles.row}>
            <span className={styles.icon}>{p.icon}</span>
            <div className={styles.rowBody}>
              <div className={styles.rowName}>{p.name}</div>
              <div className={styles.rowDesc}>{p.effect}</div>
            </div>
          </div>
        ))}

        <button className={styles.closeBtn} onClick={onClose}>Got it! ✓</button>
      </div>
    </div>
  )
}
