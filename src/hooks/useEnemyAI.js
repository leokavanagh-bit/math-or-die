import { useEffect, useRef } from 'react'

const STAT_TYPES = ['attack', 'shield', 'magic', 'aura']
const STAT_TYPES_BASIC = ['attack', 'shield']

export function pickEnemyStat(grade = 5) {
  const pool = grade <= 2 ? STAT_TYPES_BASIC : STAT_TYPES
  return pool[Math.floor(Math.random() * pool.length)]
}

export function getEnemyTickInterval(fillRate, slowedUntil) {
  if (slowedUntil && Date.now() < slowedUntil) return fillRate * 2
  return fillRate
}

export default function useEnemyAI({ phase, enemy, incrementEnemyStat, grade = 5 }) {
  const timerRef = useRef(null)

  useEffect(() => {
    if (phase !== 'setup') {
      clearTimeout(timerRef.current)
      return
    }

    // Calculate total enemy stats
    const totalStats = enemy.attack + enemy.shield + enemy.magic + enemy.aura
    if (totalStats >= enemy.maxStats) return

    const interval = getEnemyTickInterval(enemy.fillRate, enemy.slowedUntil)

    timerRef.current = setTimeout(() => {
      const stat = pickEnemyStat(grade)
      incrementEnemyStat(stat)
    }, interval)

    return () => clearTimeout(timerRef.current)
  }, [phase, enemy, incrementEnemyStat])
}
