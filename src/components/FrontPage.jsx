import { useState } from 'react'
import styles from './FrontPage.module.css'

const GRADES = [
  { grade: 1, label: 'Grade 1', ops: 'Addition',                    icon: '➕' },
  { grade: 2, label: 'Grade 2', ops: 'Addition & Subtraction',      icon: '➕➖' },
  { grade: 3, label: 'Grade 3', ops: 'Multiplication',              icon: '✖️' },
  { grade: 4, label: 'Grade 4', ops: 'All Operations',              icon: '➗' },
]

export default function FrontPage({ onStart }) {
  const [selected, setSelected] = useState(null)

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>MATH OR DIE</h1>
      <p className={styles.sub}>Choose your grade</p>

      <div className={styles.grades}>
        {GRADES.map(({ grade, label, ops, icon }) => (
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
