import { useState, useCallback, useRef } from 'react'

const ENEMY_DIFFICULTY = {
  1: { fillRate: 3000, maxStats: 6 },
  2: { fillRate: 2200, maxStats: 9 },
  3: { fillRate: 1800, maxStats: 11 },
  4: { fillRate: 1400, maxStats: 13 },
}

function initialPlayer() {
  return {
    health: 20,
    attack: 0, shield: 0, magic: 0, aura: 0,
    potions: { attack: 1, shield: 1, magic: 1, aura: 1, slow: 1, heal: 1 },
  }
}

function initialEnemy(round) {
  const diff = ENEMY_DIFFICULTY[Math.min(round, 4)]
  return {
    health: 20,
    attack: 0, shield: 0, magic: 0, aura: 0,
    fillRate: diff.fillRate,
    slowedUntil: null,
    maxStats: diff.maxStats,
  }
}

export default function useGameState(grade) {
  const playerRef = useRef(null)
  const enemyRef = useRef(null)

  const [player, _setPlayer] = useState(() => {
    const p = initialPlayer()
    playerRef.current = p
    return p
  })
  const [enemy, _setEnemy] = useState(() => {
    const e = initialEnemy(1)
    enemyRef.current = e
    return e
  })

  // Ref-syncing wrappers — update refs immediately (for same-batch reads)
  // and also inside the updater (for correctness when prev state matters)
  const setPlayer = useCallback((updater) => {
    if (typeof updater === 'function') {
      const next = updater(playerRef.current)
      playerRef.current = next
      _setPlayer(next)
    } else {
      playerRef.current = updater
      _setPlayer(updater)
    }
  }, [])

  const setEnemy = useCallback((updater) => {
    if (typeof updater === 'function') {
      const next = updater(enemyRef.current)
      enemyRef.current = next
      _setEnemy(next)
    } else {
      enemyRef.current = updater
      _setEnemy(updater)
    }
  }, [])

  const [cumStats, setCumStats] = useState({ attack: 0, shield: 0, magic: 0, aura: 0 })
  const [phase, setPhase] = useState('setup')
  const [timeRemaining, setTimeRemaining] = useState(30)
  const [round, setRound] = useState(1)
  const [activeQuestion, setActiveQuestion] = useState(null)
  const [activeStatType, setActiveStatType] = useState(null)
  const [activeIsPotion, setActiveIsPotion] = useState(false)
  const [userInput, setUserInput] = useState('')

  const incrementPlayerStat = useCallback((stat, amount) => {
    setPlayer(p => ({ ...p, [stat]: Math.min(15, p[stat] + amount) }))
    if (['attack', 'shield', 'magic', 'aura'].includes(stat)) {
      setCumStats(cs => ({ ...cs, [stat]: cs[stat] + amount }))
    }
  }, [setPlayer])

  const incrementEnemyStat = useCallback((stat) => {
    setEnemy(e => ({ ...e, [stat]: Math.min(15, e[stat] + 1) }))
  }, [setEnemy])

  const setEnemyStats = useCallback((stats) => {
    setEnemy(e => ({ ...e, ...stats }))
  }, [setEnemy])

  const consumePotion = useCallback((type) => {
    setPlayer(p => ({
      ...p,
      potions: { ...p.potions, [type]: Math.max(0, p.potions[type] - 1) },
    }))
  }, [setPlayer])

  const applyHealPotion = useCallback(() => {
    setPlayer(p => ({ ...p, health: Math.min(20, p.health + 5) }))
  }, [setPlayer])

  const applySlowPotion = useCallback(() => {
    setEnemy(e => ({ ...e, slowedUntil: Date.now() + 15000 }))
  }, [setEnemy])

  const resolveCombat = useCallback(() => {
    const p = playerRef.current
    const e = enemyRef.current
    const enemyDamage = Math.max(0, p.attack - e.shield) + Math.max(0, p.magic - e.aura)
    const playerDamage = Math.max(0, e.attack - p.shield) + Math.max(0, e.magic - p.aura)
    const newEnemyHealth = Math.max(0, e.health - enemyDamage)
    const newPlayerHealth = Math.max(0, p.health - playerDamage)

    // Update refs synchronously so same-tick reads see the new health values
    enemyRef.current = { ...e, health: newEnemyHealth }
    playerRef.current = { ...p, health: newPlayerHealth }

    setTimeout(() => {
      setEnemy(prev => ({ ...prev, health: newEnemyHealth }))
      setPlayer(prev => ({ ...prev, health: newPlayerHealth }))
      if (newEnemyHealth <= 0 || newPlayerHealth <= 0) {
        setPhase('gameOver')
      } else {
        setPhase('roundEnd')
      }
    }, 0)
  }, [setEnemy, setPlayer])

  const resetRoundStats = useCallback(() => {
    setPlayer(p => ({ ...p, attack: 0, shield: 0, magic: 0, aura: 0 }))
    setEnemy(e => ({ ...e, attack: 0, shield: 0, magic: 0, aura: 0, slowedUntil: null }))
    setActiveQuestion(null)
    setActiveStatType(null)
    setActiveIsPotion(false)
    setUserInput('')
    setTimeRemaining(30)
  }, [setPlayer, setEnemy])

  const startNextRound = useCallback(() => {
    setRound(r => {
      const nextRound = r + 1
      const diff = ENEMY_DIFFICULTY[Math.min(nextRound, 4)]
      setEnemy(e => ({ ...e, fillRate: diff.fillRate, maxStats: diff.maxStats }))
      return nextRound
    })
    resetRoundStats()
    setPhase('setup')
  }, [resetRoundStats, setEnemy])

  return {
    player, enemy, phase, timeRemaining, round, grade, cumStats,
    activeQuestion, activeStatType, activeIsPotion, userInput,
    setTimeRemaining, setPhase,
    setActiveQuestion, setActiveStatType, setActiveIsPotion, setUserInput,
    incrementPlayerStat, incrementEnemyStat, setEnemyStats,
    consumePotion, applyHealPotion, applySlowPotion,
    resolveCombat, resetRoundStats, startNextRound,
  }
}
