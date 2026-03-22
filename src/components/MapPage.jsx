import { useEffect, useState } from 'react'
import { STAGES } from '../campaign'
import styles from './MapPage.module.css'

const DESIGN_WIDTH  = 1640
const DESIGN_HEIGHT = 2360

// Zigzag path: stage 0 bottom-left, winding up to boss at top-right
const NODE_POS = [
  { x: 340,  y: 2000 },  // stage 0
  { x: 1300, y: 1680 },  // stage 1
  { x: 340,  y: 1360 },  // stage 2
  { x: 1300, y: 1040 },  // stage 3
  { x: 340,  y: 720  },  // stage 4
  { x: 820,  y: 340  },  // boss (centred at top)
]

const ENEMY_ICONS = ['🐛', '👺', '🗡️', '👹', '🧟', '💀']

export default function MapPage({ currentStage, onFight }) {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const update = () =>
      setScale(Math.min(window.innerWidth / DESIGN_WIDTH, window.innerHeight / DESIGN_HEIGHT))
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return (
    <div
      className={styles.canvas}
      style={{ transform: `scale(${scale})`, transformOrigin: 'top left',
               width: DESIGN_WIDTH, height: DESIGN_HEIGHT }}
    >
      <div className={styles.header}>
        <h1 className={styles.title}>WORLD MAP</h1>
        <p className={styles.subtitle}>Stage {currentStage + 1} of {STAGES.length}</p>
      </div>

      {/* SVG connecting lines */}
      <svg className={styles.svg} viewBox={`0 0 ${DESIGN_WIDTH} ${DESIGN_HEIGHT}`}>
        {NODE_POS.slice(0, -1).map((pos, i) => {
          const next = NODE_POS[i + 1]
          const done = i < currentStage
          return (
            <line key={i}
              x1={pos.x} y1={pos.y} x2={next.x} y2={next.y}
              stroke={done ? '#27ae60' : '#2a2a2a'}
              strokeWidth={done ? 16 : 12}
              strokeDasharray={done ? 'none' : '30 18'}
              strokeLinecap="round"
            />
          )
        })}
      </svg>

      {/* Nodes */}
      {STAGES.map((stage, i) => {
        const pos = NODE_POS[i]
        const done    = i < currentStage
        const current = i === currentStage
        const locked  = i > currentStage

        return (
          <div
            key={i}
            className={`${styles.node}
              ${done    ? styles.done    : ''}
              ${current ? styles.current : ''}
              ${locked  ? styles.locked  : ''}
              ${stage.boss ? styles.boss : ''}`}
            style={{ left: pos.x, top: pos.y }}
          >
            <div className={styles.nodeCircle}>
              {done ? '✓' : ENEMY_ICONS[i]}
            </div>
            <div className={styles.nodeLabel}>{stage.label}</div>
            <div className={styles.nodeHp}>{stage.enemyHp} HP</div>
            {current && (
              <button className={styles.fightBtn} onClick={onFight}>
                FIGHT!
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
