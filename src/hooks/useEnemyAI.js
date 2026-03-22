import { useEffect, useRef } from 'react'

const STAT_TYPES = ['attack', 'shield', 'magic', 'aura']

export function pickEnemyStat() {
  return STAT_TYPES[Math.floor(Math.random() * STAT_TYPES.length)]
}

export function getEnemyTickInterval(fillRate, slowedUntil) {
  if (slowedUntil && Date.now() < slowedUntil) return fillRate * 2
  return fillRate
}

export default function useEnemyAI({ phase, enemy, incrementEnemyStat }) {
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
      const stat = pickEnemyStat()
      incrementEnemyStat(stat)
    }, interval)

    return () => clearTimeout(timerRef.current)
  }, [phase, enemy, incrementEnemyStat])
}
