import { useState } from 'react'
import styles from './FrontPage.module.css'

const DIFFICULTIES = [
  { grade: 1, label: 'Apprentice', ops: 'Addition',              icon: '🌱' },
  { grade: 2, label: 'Warrior',    ops: 'Addition & Subtraction', icon: '⚔️' },
  { grade: 3, label: 'Mage',       ops: 'Multiplication',         icon: '✨' },
  { grade: 4, label: 'Archmage',   ops: 'All Operations',         icon: '🌟' },
]

export default function FrontPage({ onStart }) {
  const [selected, setSelected] = useState(null)

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>MATH OR DIE</h1>
      <p className={styles.sub}>Choose your difficulty</p>

      <div className={styles.grades}>
        {DIFFICULTIES.map(({ grade, label, ops, icon }) => (
          <button
            key={grade}
            className={`${styles.gradeBtn} ${selected === grade ? styles.gradeSelected : ''}`}
            onClick={() => setSelected(grade)}
          >
            <span className={styles.gradeIcon}>{icon}</span>
            <span className={styles.gradeLabel}>{label}</span>
            <span className={styles.gradeOps}>{ops}</span>
          </button>
        ))}
      </div>

      <button
        className={styles.fightBtn}
        disabled={selected === null}
        onClick={() => onStart(selected)}
      >
        FIGHT!
      </button>
    </div>
  )
}
