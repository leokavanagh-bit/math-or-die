import { useCallback, useEffect, useRef, useState } from 'react'
import useGameState from '../hooks/useGameState'
import useEnemyAI from '../hooks/useEnemyAI'
import useMathEngine from '../hooks/useMathEngine'
import useAudio from '../hooks/useAudio'
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

export default function GamePage({ grade = 1, enemyHp = 20, startingPotions = null, fillRateMult = 1.0, onVictory, onDefeat }) {
  const game   = useGameState(grade, { enemyHp, startingPotions, fillRateMult })
  const math   = useMathEngine(grade)
  const audio  = useAudio()
  const [isShaking, setIsShaking] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [scale, setScale]         = useState(1)

  // Viewport scale transform
  useEffect(() => {
    const update = () =>
      setScale(Math.min(window.innerWidth / DESIGN_WIDTH, window.innerHeight / DESIGN_HEIGHT))
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const phaseRef = useRef('setup')
  phaseRef.current = game.phase

  const shakeTimerRef   = useRef(null)
  const correctTimerRef = useRef(null)
  const musicStartedRef = useRef(false)

  useEffect(() => {
    return () => {
      clearTimeout(shakeTimerRef.current)
      clearTimeout(correctTimerRef.current)
    }
  }, [])

  // Stop music + play result jingle on game over
  useEffect(() => {
    if (game.phase === 'gameOver') {
      audio.stopMusic()
      if (game.enemy.health <= 0) audio.playVictory()
      else audio.playDefeat()
    }
  }, [game.phase]) // eslint-disable-line react-hooks/exhaustive-deps

  useEnemyAI({
    phase: game.phase,
    enemy: game.enemy,
    incrementEnemyStat: game.incrementEnemyStat,
  })

  // Start music on first user interaction (document-level resume is handled inside useAudio)
  function ensureMusic() {
    if (!musicStartedRef.current) {
      musicStartedRef.current = true
      audio.startMusic()
    }
  }

  const handleActionButton = useCallback((action) => {
    if (game.phase !== 'setup') return
    ensureMusic()
    const question = math.generate(action.operation)
    game.setActiveQuestion(question)
    game.setActiveStatType(action.type)
    game.setActiveIsPotion(false)
    game.setUserInput('')
  }, [game, math]) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePotionUse = useCallback((potionType) => {
    if (game.phase !== 'setup') return
    ensureMusic()
    const question = math.generate(POTION_OP_MAP[potionType])
    game.setActiveQuestion(question)
    game.setActiveStatType(potionType)
    game.setActiveIsPotion(true)
    game.setUserInput('')
  }, [game, math]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDigit = useCallback((digit) => {
    if (!game.activeQuestion) return
    ensureMusic()
    const newInput = (game.userInput + digit).slice(0, 4)
    const answer   = game.activeQuestion.answer

    if (parseInt(newInput) === answer) {
      setIsCorrect(true)
      correctTimerRef.current = setTimeout(() => setIsCorrect(false), 300)
      audio.playCorrect()

      if (game.activeIsPotion) {
        const pt = game.activeStatType
        game.consumePotion(pt)
        if (pt === 'slow') game.applySlowPotion()
        else if (pt === 'heal') game.applyHealPotion()
        else game.incrementPlayerStat(pt, 3)
        audio.playPotion()
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
      audio.playWrong()
      setIsShaking(true)
      shakeTimerRef.current = setTimeout(() => {
        setIsShaking(false)
        game.setUserInput('')
      }, 350)
    } else {
      game.setUserInput(newInput)
    }
  }, [game, math, audio]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleBackspace = useCallback(() => {
    game.setUserInput(prev => prev.slice(0, -1))
  }, [game])

  // Keyboard input: digits 0-9 and Backspace
  useEffect(() => {
    function handleKeyDown(e) {
      if (!game.activeQuestion || game.phase !== 'setup') return
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key)
      } else if (e.key === 'Backspace') {
        handleBackspace()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [game.activeQuestion, game.phase, handleDigit, handleBackspace])

  const handleTimerTick = useCallback(() => {
    game.setTimeRemaining(t => t - 1)
  }, [game])

  const handleTimerExpire = useCallback(() => {
    game.resolveCombat()
  }, [game])

  if (game.phase === 'roundEnd') {
    return (
      <div
        className={styles.roundEnd}
        style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: DESIGN_WIDTH, height: DESIGN_HEIGHT }}
      >
        <div className={styles.roundEndSub}>Round {game.round} complete</div>
        <div className={styles.roundEndTitle}>Round {game.round + 1}</div>
        <div className={styles.roundEndPrompt}>Are you ready?</div>
        <button
          className={styles.readyBtn}
          onClick={() => { audio.startMusic(); game.startNextRound() }}
        >
          Ready! →
        </button>
      </div>
    )
  }

  if (game.phase === 'gameOver') {
    const won = game.enemy.health <= 0
    return (
      <div
        className={styles.gameOver}
        style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: DESIGN_WIDTH, height: DESIGN_HEIGHT }}
      >
        <img
          src={won ? '/PROFILE_PIC_PLAYER.svg' : '/PROFILE_PIC_ENEMY.svg'}
          className={styles.gameOverPic}
          alt=""
        />
        <h1 className={won ? styles.victoryTitle : styles.defeatTitle}>
          {won ? 'VICTORY!' : 'DEFEATED'}
        </h1>
        <p className={styles.gameOverSub}>
          {won ? `Enemy defeated in ${game.round} round${game.round > 1 ? 's' : ''}!` : 'The enemy was too strong...'}
        </p>
        <div className={styles.statsSummary}>
          <div className={styles.statRow}><span>⚔</span><span>Attack</span><span>{game.cumStats.attack}</span></div>
          <div className={styles.statRow}><span>🛡</span><span>Shield</span><span>{game.cumStats.shield}</span></div>
          <div className={styles.statRow}><span>✨</span><span>Magic</span><span>{game.cumStats.magic}</span></div>
          <div className={styles.statRow}><span>🌟</span><span>Aura</span><span>{game.cumStats.aura}</span></div>
          <div className={`${styles.statRow} ${styles.statTotal}`}>
            <span></span><span>Total</span>
            <span>{game.cumStats.attack + game.cumStats.shield + game.cumStats.magic + game.cumStats.aura}</span>
          </div>
        </div>
        {won ? (
          <button className={styles.restartBtn} onClick={() => onVictory(game.player.potions)}>
            Continue →
          </button>
        ) : (
          <button className={`${styles.restartBtn} ${styles.defeatBtn}`} onClick={onDefeat}>
            Give Up
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      className={styles.page}
      style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: DESIGN_WIDTH, height: DESIGN_HEIGHT }}
    >
      {/* Top strip: profiles + health bars + stat panels + timer */}
      <div className={styles.topStrip}>
        <div className={styles.combatantCompact}>
          <img src="/PROFILE_PIC_PLAYER.svg" className={styles.profilePic} alt="Player" />
          <div className={styles.charLabel}>YOU</div>
          <HealthBar value={game.player.health} />
        </div>

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

        <div className={styles.combatantCompact}>
          <img src="/PROFILE_PIC_ENEMY.svg" className={styles.profilePic} alt="Enemy" />
          <div className={styles.charLabel}>
            ENEMY {game.enemy.slowedUntil && Date.now() < game.enemy.slowedUntil ? '🐢' : ''}
          </div>
          <HealthBar value={game.enemy.health} flipped />
        </div>
      </div>

      {/* Main area */}
      <div className={styles.mainArea}>
        {/* Left column: action buttons + math problem + potions */}
        <div className={styles.leftCol}>
          <div className={styles.actionButtons}>
            {ACTION_CONFIG.map(action => (
              <ActionButton
                key={action.type}
                label={action.label}
                icon={action.icon}
                color={action.color}
                isActive={game.activeStatType === action.type && !game.activeIsPotion}
                onClick={() => handleActionButton(action)}
                disabled={game.phase !== 'setup'}
              />
            ))}
          </div>

          <PotionPanel
            potions={game.player.potions}
            onUse={handlePotionUse}
            disabled={game.phase !== 'setup'}
          />
        </div>

        {/* Right column: math problem + numpad */}
        <div className={styles.rightCol}>
          {game.activeQuestion && (
            <div className={styles.mathArea}>
              <MathProblem
                question={game.activeQuestion}
                userInput={game.userInput}
                isShaking={isShaking}
                isCorrect={isCorrect}
              />
            </div>
          )}
          <NumPad
            onDigit={handleDigit}
            onBackspace={handleBackspace}
            disabled={!game.activeQuestion || game.phase !== 'setup'}
          />
        </div>
      </div>
    </div>
  )
}
