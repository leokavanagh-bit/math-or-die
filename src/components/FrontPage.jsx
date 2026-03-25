import { useEffect, useState } from 'react'
import styles from './FrontPage.module.css'
import HowToPlay from './HowToPlay'

const DESIGN_WIDTH  = 1640
const DESIGN_HEIGHT = 2360

const DIFFICULTIES = [
  { grade: 1, label: 'Apprentice', ops: 'Addition',              icon: '🌱' },
  { grade: 2, label: 'Warrior',    ops: 'Addition & Subtraction', icon: '⚔️' },
  { grade: 3, label: 'Mage',       ops: 'Multiplication',         icon: '✨' },
  { grade: 4, label: 'Archmage',   ops: 'All Operations',         icon: '🌟' },
]

export default function FrontPage({ onStart }) {
  const [selected, setSelected] = useState(null)
  const [showHelp, setShowHelp] = useState(false)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const update = () =>
      setScale(Math.min(window.innerWidth / DESIGN_WIDTH, window.innerHeight / DESIGN_HEIGHT))
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return (
    <>
    {showHelp && <HowToPlay onClose={() => setShowHelp(false)} />}
    <div
      className={styles.page}
      style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: DESIGN_WIDTH, height: DESIGN_HEIGHT }}
    >
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

      <button className={styles.helpBtn} onClick={() => setShowHelp(true)}>
        How to Play
      </button>
    </div>
    </>
  )
}
