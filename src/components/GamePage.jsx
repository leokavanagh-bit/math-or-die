import { useCallback, useEffect, useRef, useState } from 'react'
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

const STAT_COLORS = Object.fromEntries(ACTION_CONFIG.map(a => [a.type, a.color]))

const POTION_OP_MAP = {
  attack: 'addition', shield: 'subtraction', magic: 'multiplication',
  aura: 'division', slow: 'addition', heal: 'addition'
}

const DESIGN_WIDTH = 1640
const DESIGN_HEIGHT = 2360

export default function GamePage({ grade = 1 }) {
  const game = useGameState(grade)
  const math = useMathEngine(grade)
  const [isShaking, setIsShaking] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const updateScale = () => {
      setScale(Math.min(window.innerWidth / DESIGN_WIDTH, window.innerHeight / DESIGN_HEIGHT))
    }
    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [])

  const phaseRef = useRef('setup')
  phaseRef.current = game.phase

  const shakeTimerRef = useRef(null)
  const correctTimerRef = useRef(null)

  useEffect(() => {
    return () => {
      clearTimeout(shakeTimerRef.current)
      clearTimeout(correctTimerRef.current)
    }
  }, [])

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
    const question = math.generate(POTION_OP_MAP[potionType])
    game.setActiveQuestion(question)
    game.setActiveStatType(potionType)
    game.setActiveIsPotion(true)
    game.setUserInput('')
  }, [game, math])

  const handleDigit = useCallback((digit) => {
    if (!game.activeQuestion) return
    const newInput = (game.userInput + digit).slice(0, 4)
    const answer = game.activeQuestion.answer

    if (parseInt(newInput) === answer) {
      setIsCorrect(true)
      correctTimerRef.current = setTimeout(() => setIsCorrect(false), 300)

      if (game.activeIsPotion) {
        const pt = game.activeStatType
        game.consumePotion(pt)
        if (pt === 'slow') game.applySlowPotion()
        else if (pt === 'heal') game.applyHealPotion()
        else game.incrementPlayerStat(pt, 3)
        game.setActiveQuestion(null)
        game.setActiveStatType(null)
        game.setActiveIsPotion(false)
      } else {
        game.incrementPlayerStat(game.activeStatType, 1)
        const action = ACTION_CONFIG.find(a => a.type === game.activeStatType)
        if (action) game.setActiveQuestion(math.generate(action.operation))
      }
      game.setUserInput('')
    } else if (newInput.length >= String(answer).length) {
      game.setUserInput(newInput)
      setIsShaking(true)
      shakeTimerRef.current = setTimeout(() => {
        setIsShaking(false)
        game.setUserInput('')
      }, 350)
    } else {
      game.setUserInput(newInput)
    }
  }, [game, math])

  const handleBackspace = useCallback(() => {
    game.setUserInput(prev => prev.slice(0, -1))
  }, [game])

  const handleTimerTick = useCallback(() => {
    game.setTimeRemaining(t => t - 1)
  }, [game])

  const handleTimerExpire = useCallback(() => {
    game.resolveCombat()
    // resolveCombat sets phase to 'gameOver' or 'roundEnd' inside a setTimeout(0).
    // By 2500ms it is settled; read the current phase via phaseRef (updated on every render).
    setTimeout(() => {
      if (phaseRef.current === 'roundEnd') {
        game.startNextRound()
      }
    }, 2500)
  }, [game])

  if (game.phase === 'gameOver') {
    const won = game.enemy.health <= 0
    return (
      <div className={styles.gameOver} style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: DESIGN_WIDTH, height: DESIGN_HEIGHT }}>
        <h1>{won ? '🏆 VICTORY!' : '💀 DEFEATED'}</h1>
        <p>{won ? `You defeated the enemy in ${game.round} rounds!` : 'The enemy was too strong...'}</p>
      </div>
    )
  }

  return (
    <div className={styles.page} style={{ transform: `scale(${scale})` }}>
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
