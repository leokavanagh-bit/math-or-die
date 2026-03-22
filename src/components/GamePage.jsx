import { useCallback, useState } from 'react'
import useGameState from '../hooks/useGameState'
import useEnemyAI from '../hooks/useEnemyAI'
import useMathEngine from '../hooks/useMathEngine'
import StatBar from './StatBar'
import HealthBar from './HealthBar'
import Timer from './Timer'
import ActionButton from './ActionButton'
import MathProblem from './MathProblem'
import NumPad from './NumPad'
import PotionPanel from './PotionPanel'
import styles from './GamePage.module.css'

const ACTION_CONFIG = [
  { type: 'attack', label: 'Attack', icon: '⚔', color: '#e74c3c', operation: 'addition' },
  { type: 'shield', label: 'Shield', icon: '🛡', color: '#3498db', operation: 'subtraction' },
  { type: 'magic', label: 'Magic', icon: '✨', color: '#9b59b6', operation: 'multiplication' },
  { type: 'aura', label: 'Aura', icon: '🌟', color: '#f39c12', operation: 'division' },
]

const STAT_COLORS = { attack: '#e74c3c', shield: '#3498db', magic: '#9b59b6', aura: '#f39c12' }

export default function GamePage({ grade = 1 }) {
  const game = useGameState(grade)
  const math = useMathEngine(grade)
  const [isShaking, setIsShaking] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  useEnemyAI({
    phase: game.phase,
    enemy: game.enemy,
    incrementEnemyStat: game.incrementEnemyStat,
  })

  const handleActionButton = useCallback((action) => {
    if (game.phase !== 'setup') return
    const question = math.generate(action.operation)
    game.setActiveQuestion(question)
    game.setActiveStatType(action.type)
    game.setActiveIsPotion(false)
    game.setUserInput('')
  }, [game, math])

  const handlePotionUse = useCallback((potionType) => {
    if (game.phase !== 'setup') return
    // Stat potions use their paired operation. Slow and Heal use addition (spec: "any simple problem").
    const potionOpMap = { attack: 'addition', shield: 'subtraction', magic: 'multiplication', aura: 'division', slow: 'addition', heal: 'addition' }
    const question = math.generate(potionOpMap[potionType])
    game.setActiveQuestion(question)
    game.setActiveStatType(potionType)
    game.setActiveIsPotion(true)
    game.setUserInput('')
  }, [game, math])

  const handleDigit = useCallback((digit) => {
    game.setUserInput(prev => (prev + digit).slice(0, 4))
  }, [game])

  const handleBackspace = useCallback(() => {
    game.setUserInput(prev => prev.slice(0, -1))
  }, [game])

  const handleConfirm = useCallback(() => {
    if (!game.activeQuestion || !game.userInput) return
    const isRight = parseInt(game.userInput) === game.activeQuestion.answer

    if (isRight) {
      setIsCorrect(true)
      setTimeout(() => setIsCorrect(false), 300)

      if (game.activeIsPotion) {
        const pt = game.activeStatType
        game.consumePotion(pt)
        if (pt === 'slow') game.applySlowPotion()
        else if (pt === 'heal') game.applyHealPotion()
        else game.incrementPlayerStat(pt, 3)
      } else {
        game.incrementPlayerStat(game.activeStatType, 1)
      }

      // Auto-generate next question for same stat (if not potion)
      if (!game.activeIsPotion) {
        const action = ACTION_CONFIG.find(a => a.type === game.activeStatType)
        if (action) {
          const next = math.generate(action.operation)
          game.setActiveQuestion(next)
        }
      } else {
        game.setActiveQuestion(null)
        game.setActiveStatType(null)
        game.setActiveIsPotion(false)
      }
      game.setUserInput('')
    } else {
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 350)
      game.setUserInput('')
    }
  }, [game, math])

  const handleTimerTick = useCallback(() => {
    game.setTimeRemaining(t => t - 1)
  }, [game])

  const handleTimerExpire = useCallback(() => {
    game.setPhase('combat')
    game.resolveCombat()
    // Wait for resolveCombat's async state updates (setTimeout 0 inside) + animation time.
    // Check phase via setPhase callback to avoid stale closure — resolveCombat sets
    // 'gameOver' or 'roundEnd' inside its own setTimeout(0), so by 2500ms it is settled.
    setTimeout(() => {
      game.setPhase(currentPhase => {
        if (currentPhase === 'roundEnd') {
          game.startNextRound()
        }
        return currentPhase
      })
    }, 2500)
  }, [game])

  if (game.phase === 'gameOver') {
    const won = game.enemy.health <= 0
    return (
      <div className={styles.gameOver}>
        <h1>{won ? '🏆 VICTORY!' : '💀 DEFEATED'}</h1>
        <p>{won ? `You defeated the enemy in ${game.round} rounds!` : 'The enemy was too strong...'}</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      {/* Characters + Health */}
      <div className={styles.topRow}>
        <div className={styles.combatant}>
          <div className={styles.charLabel}>YOU</div>
          <HealthBar value={game.player.health} />
        </div>
        <div className={styles.vsLabel}>VS</div>
        <div className={styles.combatant}>
          <div className={styles.charLabel}>
            ENEMY {game.enemy.slowedUntil && Date.now() < game.enemy.slowedUntil ? '🐢' : ''}
          </div>
          <HealthBar value={game.enemy.health} flipped />
        </div>
      </div>

      {/* Stats + Timer */}
      <div className={styles.statsRow}>
        <div className={styles.statPanel}>
          {ACTION_CONFIG.map(a => (
            <StatBar key={a.type} value={game.player[a.type]} color={STAT_COLORS[a.type]} label={a.label} />
          ))}
        </div>
        <Timer
          timeRemaining={game.timeRemaining}
          phase={game.phase}
          onTick={handleTimerTick}
          onExpire={handleTimerExpire}
        />
        <div className={styles.statPanel}>
          {ACTION_CONFIG.map(a => (
            <StatBar key={a.type} value={game.enemy[a.type]} color={STAT_COLORS[a.type]} label={a.label} />
          ))}
        </div>
      </div>

      {/* Action buttons + Math problem */}
      <div className={styles.actionsRow}>
        <div className={styles.actionButtons}>
          {ACTION_CONFIG.map(action => (
            <div key={action.type} className={styles.actionRow}>
              <ActionButton
                label={action.label}
                icon={action.icon}
                color={action.color}
                isActive={game.activeStatType === action.type && !game.activeIsPotion}
                onClick={() => handleActionButton(action)}
                disabled={game.phase !== 'setup'}
              />
              {game.activeStatType === action.type && !game.activeIsPotion && (
                <MathProblem
                  question={game.activeQuestion}
                  userInput={game.userInput}
                  isShaking={isShaking}
                  isCorrect={isCorrect}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Potions + NumPad */}
      <div className={styles.bottomRow}>
        <PotionPanel
          potions={game.player.potions}
          onUse={handlePotionUse}
          disabled={game.phase !== 'setup'}
        />
        <NumPad
          onDigit={handleDigit}
          onBackspace={handleBackspace}
          onConfirm={handleConfirm}
          disabled={!game.activeQuestion || game.phase !== 'setup'}
        />
      </div>

      {/* Active potion math problem overlay */}
      {game.activeIsPotion && game.activeQuestion && (
        <div className={styles.potionProblem}>
          <MathProblem
            question={game.activeQuestion}
            userInput={game.userInput}
            isShaking={isShaking}
            isCorrect={isCorrect}
          />
        </div>
      )}
    </div>
  )
}
