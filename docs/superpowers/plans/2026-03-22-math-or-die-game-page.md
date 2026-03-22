# Math or Die — Game Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working React + Vite web app for the Math or Die game page — a math-combat RPG optimised for iPad 10 portrait, where a player solves math problems to fill combat stats and fight an AI enemy.

**Architecture:** React 18 + Vite. Three custom hooks own all logic (`useGameState`, `useEnemyAI`, `useMathEngine`). Components are pure presentational wrappers around those hooks. `GamePage.jsx` composes everything. No external state libraries.

**Tech Stack:** React 18, Vite 5, Vitest + React Testing Library (tests), CSS Modules for scoped styles.

---

## File Map

| File | Responsibility |
|------|---------------|
| `src/App.jsx` | Routes between FrontPage stub and GamePage |
| `src/main.jsx` | Vite entry point, viewport meta |
| `src/index.css` | Global reset, full-screen body, iPad viewport |
| `src/components/GamePage.jsx` | Root game screen, wires all components to hooks |
| `src/components/FrontPage.jsx` | Stub — "Start Game" button only |
| `src/components/StatBar.jsx` | 15-slot reusable stat bar (player + enemy) |
| `src/components/HealthBar.jsx` | 20-segment HP bar (player + enemy) |
| `src/components/Timer.jsx` | 60s countdown, red pulse under 10s |
| `src/components/ActionButton.jsx` | Single action button (Attack/Shield/Magic/Aura) |
| `src/components/MathProblem.jsx` | Active question display + answer area |
| `src/components/NumPad.jsx` | 0–9 + backspace + confirm touch pad |
| `src/components/PotionPanel.jsx` | 6 potion slots with consumed state |
| `src/hooks/useMathEngine.js` | Generates math problems by grade + operation |
| `src/hooks/useGameState.js` | All game state + phase transitions + combat resolution |
| `src/hooks/useEnemyAI.js` | Enemy stat-filling tick, Slow potion effect |
| `src/assets/` | SVG art exported from MATH_OR_DIE.ai |
| `src/components/*.module.css` | Scoped styles per component |

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `src/main.jsx`, `src/App.jsx`, `src/index.css`

- [ ] **Step 1: Scaffold Vite + React project**

Run from `/Users/leokavanagh/Documents/Work/Claude_Code/Math_or_Die`:
```bash
npm create vite@latest . -- --template react
npm install
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

- [ ] **Step 2: Configure Vitest in vite.config.js**

Replace `vite.config.js` contents:
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.js',
  },
})
```

- [ ] **Step 3: Create test setup file**

Create `src/test-setup.js`:
```js
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Set up global CSS for iPad full-screen**

Replace `src/index.css`:
```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #000;
  font-family: system-ui, sans-serif;
}

#root {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
```

- [ ] **Step 5: Update index.html viewport meta**

In `index.html`, ensure `<head>` contains:
```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-fullscreen" />
```

- [ ] **Step 6: Stub App.jsx**

Replace `src/App.jsx`:
```jsx
import { useState } from 'react'
import FrontPage from './components/FrontPage'
import GamePage from './components/GamePage'

export default function App() {
  const [started, setStarted] = useState(false)

  if (!started) return <FrontPage onStart={() => setStarted(true)} />
  return <GamePage grade={1} />
}
```

- [ ] **Step 7: Stub FrontPage**

Create `src/components/FrontPage.jsx`:
```jsx
export default function FrontPage({ onStart }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#1a0a00' }}>
      <button
        onClick={onStart}
        style={{ fontSize: '2rem', padding: '1rem 3rem', background: '#c0392b', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer' }}
      >
        FIGHT!
      </button>
    </div>
  )
}
```

- [ ] **Step 8: Stub GamePage so app renders**

Create `src/components/GamePage.jsx`:
```jsx
export default function GamePage({ grade }) {
  return <div style={{ color: 'white', padding: 20 }}>Game Page — grade {grade}</div>
}
```

- [ ] **Step 9: Verify app runs**

```bash
npm run dev
```
Expected: App opens in browser, shows "FIGHT!" button, clicking it shows "Game Page — grade 1".

- [ ] **Step 10: Commit**

```bash
git init
git add -A
git commit -m "feat: scaffold vite+react project with vitest"
```

---

## Task 2: Math Engine Hook

**Files:**
- Create: `src/hooks/useMathEngine.js`
- Create: `src/hooks/__tests__/useMathEngine.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/hooks/__tests__/useMathEngine.test.js`:
```js
import { generateProblem } from '../useMathEngine'

describe('generateProblem', () => {
  describe('grade 1 addition', () => {
    it('produces operands in 1–10 range', () => {
      for (let i = 0; i < 50; i++) {
        const p = generateProblem('addition', 1)
        expect(p.a).toBeGreaterThanOrEqual(1)
        expect(p.a).toBeLessThanOrEqual(10)
        expect(p.b).toBeGreaterThanOrEqual(1)
        expect(p.b).toBeLessThanOrEqual(10)
      }
    })
    it('answer equals a + b', () => {
      const p = generateProblem('addition', 1)
      expect(p.answer).toBe(p.a + p.b)
    })
  })

  describe('grade 1 subtraction', () => {
    it('never produces negative answers', () => {
      for (let i = 0; i < 50; i++) {
        const p = generateProblem('subtraction', 1)
        expect(p.answer).toBeGreaterThanOrEqual(0)
      }
    })
  })

  describe('grade 1 multiplication', () => {
    it('operands in 1–5 range', () => {
      for (let i = 0; i < 50; i++) {
        const p = generateProblem('multiplication', 1)
        expect(p.a).toBeGreaterThanOrEqual(1)
        expect(p.a).toBeLessThanOrEqual(5)
        expect(p.b).toBeGreaterThanOrEqual(1)
        expect(p.b).toBeLessThanOrEqual(5)
      }
    })
    it('answer equals a * b', () => {
      const p = generateProblem('multiplication', 1)
      expect(p.answer).toBe(p.a * p.b)
    })
  })

  describe('grade 1 division', () => {
    it('divisor is 2 or 5 only', () => {
      for (let i = 0; i < 50; i++) {
        const p = generateProblem('division', 1)
        expect([2, 5]).toContain(p.b)
      }
    })
    it('answer is always a whole number', () => {
      for (let i = 0; i < 50; i++) {
        const p = generateProblem('division', 1)
        expect(p.answer % 1).toBe(0)
      }
    })
  })

  describe('problem shape', () => {
    it('returns operation, a, b, answer', () => {
      const p = generateProblem('addition', 1)
      expect(p).toHaveProperty('operation')
      expect(p).toHaveProperty('a')
      expect(p).toHaveProperty('b')
      expect(p).toHaveProperty('answer')
    })
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/hooks/__tests__/useMathEngine.test.js
```
Expected: FAIL — "generateProblem is not a function"

- [ ] **Step 3: Implement useMathEngine**

Create `src/hooks/useMathEngine.js`:
```js
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const GRADE_CONFIG = {
  addition: {
    1: () => { const a = randInt(1,10), b = randInt(1,10); return { a, b, answer: a+b } },
    2: () => { const a = randInt(1,20), b = randInt(1,20); return { a, b, answer: a+b } },
    3: () => { const a = randInt(10,99), b = randInt(10,99); return { a, b, answer: a+b } },
    4: () => { const a = randInt(100,999), b = randInt(10,99); return { a, b, answer: a+b } },
  },
  subtraction: {
    1: () => { const b = randInt(1,5), a = randInt(b,10); return { a, b, answer: a-b } },
    2: () => { const b = randInt(1,10), a = randInt(b,20); return { a, b, answer: a-b } },
    3: () => { const b = randInt(10,99), a = randInt(b,99); return { a, b, answer: a-b } },
    4: () => { const b = randInt(10,99), a = randInt(b,999); return { a, b, answer: a-b } },
  },
  multiplication: {
    1: () => { const a = randInt(1,5), b = randInt(1,5); return { a, b, answer: a*b } },
    2: () => { const a = randInt(1,10), b = randInt(1,5); return { a, b, answer: a*b } },
    3: () => { const a = randInt(1,10), b = randInt(1,10); return { a, b, answer: a*b } },
    4: () => { const a = randInt(10,19), b = randInt(2,9); return { a, b, answer: a*b } },
  },
  division: {
    1: () => { const b = [2,5][randInt(0,1)], a = b * randInt(1,10); return { a, b, answer: a/b } },
    2: () => { const b = [2,3,5][randInt(0,2)], a = b * randInt(1,10); return { a, b, answer: a/b } },
    3: () => { const b = randInt(2,10), a = b * randInt(1,10); return { a, b, answer: a/b } },
    4: () => { const b = randInt(2,9), a = b * randInt(10,19); return { a, b, answer: a/b } },
  },
}

export function generateProblem(operation, grade) {
  const gen = GRADE_CONFIG[operation][grade]
  const { a, b, answer } = gen()
  return { operation, a, b, answer }
}

export default function useMathEngine(grade) {
  return {
    generate: (operation) => generateProblem(operation, grade),
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/hooks/__tests__/useMathEngine.test.js
```
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useMathEngine.js src/hooks/__tests__/useMathEngine.test.js
git commit -m "feat: add useMathEngine hook with grade-based problem generation"
```

---

## Task 3: Game State Hook

**Files:**
- Create: `src/hooks/useGameState.js`
- Create: `src/hooks/__tests__/useGameState.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/hooks/__tests__/useGameState.test.js`:
```js
import { renderHook, act } from '@testing-library/react'
import useGameState from '../useGameState'

describe('useGameState', () => {
  it('initialises with setup phase and full health', () => {
    const { result } = renderHook(() => useGameState(1))
    expect(result.current.phase).toBe('setup')
    expect(result.current.player.health).toBe(20)
    expect(result.current.enemy.health).toBe(20)
    expect(result.current.timeRemaining).toBe(60)
  })

  it('starts with all player stats at 0', () => {
    const { result } = renderHook(() => useGameState(1))
    const { attack, shield, magic, aura } = result.current.player
    expect(attack).toBe(0)
    expect(shield).toBe(0)
    expect(magic).toBe(0)
    expect(aura).toBe(0)
  })

  it('starts with 1 of each potion', () => {
    const { result } = renderHook(() => useGameState(1))
    const { potions } = result.current.player
    expect(potions.attack).toBe(1)
    expect(potions.heal).toBe(1)
    expect(potions.slow).toBe(1)
  })

  it('incrementPlayerStat adds 1 to the correct stat', () => {
    const { result } = renderHook(() => useGameState(1))
    act(() => result.current.incrementPlayerStat('attack', 1))
    expect(result.current.player.attack).toBe(1)
  })

  it('incrementPlayerStat caps at 15', () => {
    const { result } = renderHook(() => useGameState(1))
    act(() => {
      for (let i = 0; i < 20; i++) result.current.incrementPlayerStat('attack', 1)
    })
    expect(result.current.player.attack).toBe(15)
  })

  it('combat resolution reduces enemy health by attack - shield', () => {
    const { result } = renderHook(() => useGameState(1))
    // Set player attack=5, enemy shield=2, all other stats=0
    act(() => {
      for (let i = 0; i < 5; i++) result.current.incrementPlayerStat('attack', 1)
      result.current.setEnemyStats({ attack: 0, shield: 2, magic: 0, aura: 0 })
      result.current.resolveCombat()
    })
    expect(result.current.enemy.health).toBe(17) // 20 - (5-2)=3
  })

  it('combat damage cannot go below 0 (attack <= shield)', () => {
    const { result } = renderHook(() => useGameState(1))
    act(() => {
      for (let i = 0; i < 3; i++) result.current.incrementPlayerStat('attack', 1)
      result.current.setEnemyStats({ attack: 0, shield: 5, magic: 0, aura: 0 })
      result.current.resolveCombat()
    })
    expect(result.current.enemy.health).toBe(20) // no damage
  })

  it('consumePotion decrements potion count', () => {
    const { result } = renderHook(() => useGameState(1))
    act(() => result.current.consumePotion('attack'))
    expect(result.current.player.potions.attack).toBe(0)
  })

  it('consumePotion does not go below 0', () => {
    const { result } = renderHook(() => useGameState(1))
    act(() => {
      result.current.consumePotion('attack')
      result.current.consumePotion('attack')
    })
    expect(result.current.player.potions.attack).toBe(0)
  })

  it('heal potion adds 5 HP capped at 20', () => {
    const { result } = renderHook(() => useGameState(1))
    act(() => result.current.applyHealPotion())
    expect(result.current.player.health).toBe(20) // already full
  })

  it('resetRoundStats resets all stats to 0 but keeps health', () => {
    const { result } = renderHook(() => useGameState(1))
    act(() => {
      for (let i = 0; i < 5; i++) result.current.incrementPlayerStat('attack', 1)
      result.current.resetRoundStats()
    })
    expect(result.current.player.attack).toBe(0)
    expect(result.current.player.health).toBe(20)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/hooks/__tests__/useGameState.test.js
```
Expected: FAIL — "useGameState is not a function"

- [ ] **Step 3: Implement useGameState**

Create `src/hooks/useGameState.js`:
```js
import { useState, useCallback } from 'react'

const ENEMY_DIFFICULTY = {
  1: { fillRate: 4000, maxStats: 6 },
  2: { fillRate: 3000, maxStats: 9 },
  3: { fillRate: 2500, maxStats: 11 },
  4: { fillRate: 2000, maxStats: 13 },
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
  const [player, setPlayer] = useState(initialPlayer)
  const [enemy, setEnemy] = useState(() => initialEnemy(1))
  const [phase, setPhase] = useState('setup')
  const [timeRemaining, setTimeRemaining] = useState(60)
  const [round, setRound] = useState(1)
  const [activeQuestion, setActiveQuestion] = useState(null)
  const [activeStatType, setActiveStatType] = useState(null)
  const [activeIsPotion, setActiveIsPotion] = useState(false)
  const [userInput, setUserInput] = useState('')

  const incrementPlayerStat = useCallback((stat, amount) => {
    setPlayer(p => ({ ...p, [stat]: Math.min(15, p[stat] + amount) }))
  }, [])

  const incrementEnemyStat = useCallback((stat) => {
    setEnemy(e => ({ ...e, [stat]: Math.min(15, e[stat] + 1) }))
  }, [])

  const setEnemyStats = useCallback((stats) => {
    setEnemy(e => ({ ...e, ...stats }))
  }, [])

  const consumePotion = useCallback((type) => {
    setPlayer(p => ({
      ...p,
      potions: { ...p.potions, [type]: Math.max(0, p.potions[type] - 1) },
    }))
  }, [])

  const applyHealPotion = useCallback(() => {
    setPlayer(p => ({ ...p, health: Math.min(20, p.health + 5) }))
  }, [])

  const applySlowPotion = useCallback(() => {
    setEnemy(e => ({ ...e, slowedUntil: Date.now() + 15000 }))
  }, [])

  const resolveCombat = useCallback(() => {
    setPlayer(p => {
      setEnemy(e => {
        const enemyDamage = Math.max(0, p.attack - e.shield) + Math.max(0, p.magic - e.aura)
        const playerDamage = Math.max(0, e.attack - p.shield) + Math.max(0, e.magic - p.aura)
        const newEnemyHealth = Math.max(0, e.health - enemyDamage)
        const newPlayerHealth = Math.max(0, p.health - playerDamage)

        // Update enemy health
        setTimeout(() => {
          setEnemy(prev => ({ ...prev, health: newEnemyHealth }))
          setPlayer(prev => ({ ...prev, health: newPlayerHealth }))
          if (newEnemyHealth <= 0 || newPlayerHealth <= 0) {
            setPhase('gameOver')
          } else {
            setPhase('roundEnd')
          }
        }, 0)

        return e
      })
      return p
    })
  }, [])

  const resetRoundStats = useCallback(() => {
    setPlayer(p => ({ ...p, attack: 0, shield: 0, magic: 0, aura: 0 }))
    setEnemy(e => ({ ...e, attack: 0, shield: 0, magic: 0, aura: 0, slowedUntil: null }))
    setActiveQuestion(null)
    setActiveStatType(null)
    setActiveIsPotion(false)
    setUserInput('')
    setTimeRemaining(60)
  }, [])

  const startNextRound = useCallback(() => {
    const nextRound = round + 1
    setRound(nextRound)
    setEnemy(e => {
      const diff = ENEMY_DIFFICULTY[Math.min(nextRound, 4)]
      return { ...e, fillRate: diff.fillRate, maxStats: diff.maxStats }
    })
    resetRoundStats()
    setPhase('setup')
  }, [round, resetRoundStats])

  return {
    player, enemy, phase, timeRemaining, round, grade,
    activeQuestion, activeStatType, activeIsPotion, userInput,
    setTimeRemaining, setPhase,
    setActiveQuestion, setActiveStatType, setActiveIsPotion, setUserInput,
    incrementPlayerStat, incrementEnemyStat, setEnemyStats,
    consumePotion, applyHealPotion, applySlowPotion,
    resolveCombat, resetRoundStats, startNextRound,
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/hooks/__tests__/useGameState.test.js
```
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useGameState.js src/hooks/__tests__/useGameState.test.js
git commit -m "feat: add useGameState hook with combat resolution"
```

---

## Task 4: Enemy AI Hook

**Files:**
- Create: `src/hooks/useEnemyAI.js`
- Create: `src/hooks/__tests__/useEnemyAI.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/hooks/__tests__/useEnemyAI.test.js`:
```js
import { getEnemyTickInterval, pickEnemyStat } from '../useEnemyAI'

describe('getEnemyTickInterval', () => {
  it('returns base fillRate when not slowed', () => {
    expect(getEnemyTickInterval(4000, null)).toBe(4000)
  })

  it('doubles fillRate when slowed', () => {
    const futureTime = Date.now() + 10000
    expect(getEnemyTickInterval(4000, futureTime)).toBe(8000)
  })

  it('returns base fillRate when slow has expired', () => {
    const pastTime = Date.now() - 1000
    expect(getEnemyTickInterval(4000, pastTime)).toBe(4000)
  })
})

describe('pickEnemyStat', () => {
  it('returns one of the four stat types', () => {
    const stats = ['attack', 'shield', 'magic', 'aura']
    for (let i = 0; i < 20; i++) {
      expect(stats).toContain(pickEnemyStat())
    }
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/hooks/__tests__/useEnemyAI.test.js
```
Expected: FAIL

- [ ] **Step 3: Implement useEnemyAI**

Create `src/hooks/useEnemyAI.js`:
```js
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
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/hooks/__tests__/useEnemyAI.test.js
```
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useEnemyAI.js src/hooks/__tests__/useEnemyAI.test.js
git commit -m "feat: add useEnemyAI hook with tick-based stat filling"
```

---

## Task 5: StatBar Component

**Files:**
- Create: `src/components/StatBar.jsx`
- Create: `src/components/StatBar.module.css`
- Create: `src/components/__tests__/StatBar.test.jsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/__tests__/StatBar.test.jsx`:
```jsx
import { render, screen } from '@testing-library/react'
import StatBar from '../StatBar'

describe('StatBar', () => {
  it('renders 15 slots', () => {
    const { container } = render(<StatBar value={0} color="red" />)
    expect(container.querySelectorAll('.slot')).toHaveLength(15)
  })

  it('fills the correct number of slots', () => {
    const { container } = render(<StatBar value={5} color="red" />)
    const filled = container.querySelectorAll('.slot.filled')
    expect(filled).toHaveLength(5)
  })

  it('does not exceed 15 filled slots', () => {
    const { container } = render(<StatBar value={20} color="red" />)
    const filled = container.querySelectorAll('.slot.filled')
    expect(filled).toHaveLength(15)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/components/__tests__/StatBar.test.jsx
```
Expected: FAIL

- [ ] **Step 3: Implement StatBar**

Create `src/components/StatBar.jsx`:
```jsx
import styles from './StatBar.module.css'

export default function StatBar({ value, color, label }) {
  const filled = Math.min(15, Math.max(0, value))
  return (
    <div className={styles.statBar}>
      {label && <span className={styles.label}>{label}</span>}
      <div className={styles.slots}>
        {Array.from({ length: 15 }, (_, i) => (
          <div
            key={i}
            className={`${styles.slot} slot ${i < filled ? `${styles.filled} filled` : ''}`}
            style={i < filled ? { background: color } : {}}
          />
        ))}
      </div>
    </div>
  )
}
```

Create `src/components/StatBar.module.css`:
```css
.statBar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #ccc;
  width: 50px;
  flex-shrink: 0;
}

.slots {
  display: flex;
  gap: 4px;
}

.slot {
  width: 23px;
  height: 53px;
  background: #333;
  border-radius: 3px;
  transition: background 0.15s ease;
}

.filled {
  box-shadow: 0 0 6px rgba(255,255,255,0.3);
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/components/__tests__/StatBar.test.jsx
```
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/StatBar.jsx src/components/StatBar.module.css src/components/__tests__/StatBar.test.jsx
git commit -m "feat: add StatBar component with 15 slots"
```

---

## Task 6: HealthBar Component

**Files:**
- Create: `src/components/HealthBar.jsx`
- Create: `src/components/HealthBar.module.css`
- Create: `src/components/__tests__/HealthBar.test.jsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/__tests__/HealthBar.test.jsx`:
```jsx
import { render } from '@testing-library/react'
import HealthBar from '../HealthBar'

describe('HealthBar', () => {
  it('renders 20 segments', () => {
    const { container } = render(<HealthBar value={20} />)
    expect(container.querySelectorAll('.segment')).toHaveLength(20)
  })

  it('fills correct number of segments', () => {
    const { container } = render(<HealthBar value={12} />)
    expect(container.querySelectorAll('.segment.filled')).toHaveLength(12)
  })

  it('renders 0 filled segments when health is 0', () => {
    const { container } = render(<HealthBar value={0} />)
    expect(container.querySelectorAll('.segment.filled')).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/components/__tests__/HealthBar.test.jsx
```
Expected: FAIL

- [ ] **Step 3: Implement HealthBar**

Create `src/components/HealthBar.jsx`:
```jsx
import styles from './HealthBar.module.css'

export default function HealthBar({ value, flipped = false }) {
  const filled = Math.min(20, Math.max(0, value))
  const segments = Array.from({ length: 20 }, (_, i) => i < filled)
  if (flipped) segments.reverse()

  return (
    <div className={styles.healthBar}>
      {segments.map((isFilled, i) => (
        <div
          key={i}
          className={`${styles.segment} segment ${isFilled ? `${styles.filled} filled` : ''}`}
        />
      ))}
    </div>
  )
}
```

Create `src/components/HealthBar.module.css`:
```css
.healthBar {
  display: flex;
  gap: 3px;
  width: 100%;
}

.segment {
  flex: 1;
  height: 81px;
  background: #333;
  border-radius: 2px;
  transition: background 0.3s ease;
}

.filled {
  background: #27ae60;
  box-shadow: 0 0 4px rgba(39, 174, 96, 0.5);
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/components/__tests__/HealthBar.test.jsx
```
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/HealthBar.jsx src/components/HealthBar.module.css src/components/__tests__/HealthBar.test.jsx
git commit -m "feat: add HealthBar component with 20 segments"
```

---

## Task 7: Timer Component

**Files:**
- Create: `src/components/Timer.jsx`
- Create: `src/components/Timer.module.css`

- [ ] **Step 1: Implement Timer**

Create `src/components/Timer.jsx`:
```jsx
import { useEffect } from 'react'
import styles from './Timer.module.css'

export default function Timer({ timeRemaining, phase, onTick, onExpire }) {
  useEffect(() => {
    if (phase !== 'setup') return
    if (timeRemaining <= 0) { onExpire(); return }

    const id = setInterval(() => onTick(), 1000)
    return () => clearInterval(id)
  }, [timeRemaining, phase, onTick, onExpire])

  const isUrgent = timeRemaining <= 10

  return (
    <div className={`${styles.timer} ${isUrgent ? styles.urgent : ''}`}>
      <div className={styles.display}>
        {String(timeRemaining).padStart(2, '0')}
      </div>
    </div>
  )
}
```

Create `src/components/Timer.module.css`:
```css
.timer {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 291px;
  height: 347px;
  background: #1a1a1a;
  border: 2px solid #444;
  border-radius: 8px;
}

.display {
  font-size: 5rem;
  font-weight: 900;
  color: #e0c97f;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.urgent .display {
  color: #e74c3c;
  animation: pulse 0.5s ease-in-out infinite alternate;
}

@keyframes pulse {
  from { opacity: 1; transform: scale(1); }
  to { opacity: 0.7; transform: scale(1.05); }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Timer.jsx src/components/Timer.module.css
git commit -m "feat: add Timer component with urgent pulse animation"
```

---

## Task 8: NumPad Component

**Files:**
- Create: `src/components/NumPad.jsx`
- Create: `src/components/NumPad.module.css`
- Create: `src/components/__tests__/NumPad.test.jsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/__tests__/NumPad.test.jsx`:
```jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NumPad from '../NumPad'

describe('NumPad', () => {
  it('calls onDigit with the pressed number', async () => {
    const onDigit = vi.fn()
    render(<NumPad onDigit={onDigit} onBackspace={() => {}} onConfirm={() => {}} />)
    await userEvent.click(screen.getByText('5'))
    expect(onDigit).toHaveBeenCalledWith('5')
  })

  it('calls onBackspace when backspace is pressed', async () => {
    const onBackspace = vi.fn()
    render(<NumPad onDigit={() => {}} onBackspace={onBackspace} onConfirm={() => {}} />)
    await userEvent.click(screen.getByText('⌫'))
    expect(onBackspace).toHaveBeenCalled()
  })

  it('calls onConfirm when confirm is pressed', async () => {
    const onConfirm = vi.fn()
    render(<NumPad onDigit={() => {}} onBackspace={() => {}} onConfirm={onConfirm} />)
    await userEvent.click(screen.getByText('✓'))
    expect(onConfirm).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/components/__tests__/NumPad.test.jsx
```
Expected: FAIL

- [ ] **Step 3: Implement NumPad**

Create `src/components/NumPad.jsx`:
```jsx
import styles from './NumPad.module.css'

const ROWS = [['7','8','9'], ['4','5','6'], ['1','2','3'], ['⌫','0','✓']]

export default function NumPad({ onDigit, onBackspace, onConfirm, disabled }) {
  function handlePress(key) {
    if (disabled) return
    if (key === '⌫') onBackspace()
    else if (key === '✓') onConfirm()
    else onDigit(key)
  }

  return (
    <div className={styles.numPad}>
      {ROWS.map((row, ri) => (
        <div key={ri} className={styles.row}>
          {row.map(key => (
            <button
              key={key}
              className={`${styles.key} ${key === '✓' ? styles.confirm : ''} ${key === '⌫' ? styles.backspace : ''}`}
              onPointerDown={() => handlePress(key)}
              disabled={disabled}
            >
              {key}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}
```

Create `src/components/NumPad.module.css`:
```css
.numPad {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 24px;
  background: #1a1a1a;
  border: 2px solid #444;
  border-radius: 8px;
  width: 738px;
  height: 595px;
  justify-content: center;
}

.row {
  display: flex;
  gap: 8px;
}

.key {
  flex: 1;
  height: 118px;
  font-size: 2.5rem;
  font-weight: 700;
  background: #2a2a2a;
  color: #fff;
  border: 2px solid #555;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.1s, transform 0.05s;
  -webkit-user-select: none;
  user-select: none;
}

.key:active {
  background: #444;
  transform: scale(0.96);
}

.confirm {
  background: #1a5c2a;
  border-color: #27ae60;
  color: #27ae60;
}

.confirm:active {
  background: #27ae60;
  color: #fff;
}

.backspace {
  background: #3a1a1a;
  border-color: #c0392b;
  color: #c0392b;
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/components/__tests__/NumPad.test.jsx
```
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/NumPad.jsx src/components/NumPad.module.css src/components/__tests__/NumPad.test.jsx
git commit -m "feat: add NumPad component with large touch targets"
```

---

## Task 9: ActionButton + MathProblem Components

**Files:**
- Create: `src/components/ActionButton.jsx`
- Create: `src/components/ActionButton.module.css`
- Create: `src/components/MathProblem.jsx`
- Create: `src/components/MathProblem.module.css`

- [ ] **Step 1: Implement ActionButton**

Create `src/components/ActionButton.jsx`:
```jsx
import styles from './ActionButton.module.css'

export default function ActionButton({ label, icon, color, isActive, onClick, disabled }) {
  return (
    <button
      className={`${styles.button} ${isActive ? styles.active : ''}`}
      style={isActive ? { borderColor: color, boxShadow: `0 0 12px ${color}` } : {}}
      onClick={onClick}
      disabled={disabled}
    >
      <span className={styles.icon}>{icon}</span>
      <span className={styles.label}>{label}</span>
    </button>
  )
}
```

Create `src/components/ActionButton.module.css`:
```css
.button {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 300px;
  height: 109px;
  padding: 0 24px;
  background: #1a1a1a;
  border: 2px solid #444;
  border-radius: 8px;
  color: #fff;
  font-size: 1.5rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.1s;
  -webkit-user-select: none;
  user-select: none;
}

.button:active {
  transform: scale(0.97);
}

.active {
  background: #111;
}

.icon {
  font-size: 2.5rem;
}

.label {
  font-size: 1.4rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

- [ ] **Step 2: Implement MathProblem**

Create `src/components/MathProblem.jsx`:
```jsx
import styles from './MathProblem.module.css'

const OP_SYMBOLS = { addition: '+', subtraction: '−', multiplication: '×', division: '÷' }

export default function MathProblem({ question, userInput, isShaking, isCorrect }) {
  if (!question) {
    return <div className={styles.empty}>Select a button to begin</div>
  }

  const { operation, a, b } = question
  const symbol = OP_SYMBOLS[operation]

  return (
    <div className={`${styles.problem} ${isShaking ? styles.shake : ''} ${isCorrect ? styles.correct : ''}`}>
      <div className={styles.equation}>
        <span className={styles.number}>{a}</span>
        <span className={styles.operator}>{symbol}</span>
        <span className={styles.number}>{b}</span>
        <span className={styles.equals}>=</span>
        <span className={styles.answer}>{userInput || '?'}</span>
      </div>
    </div>
  )
}
```

Create `src/components/MathProblem.module.css`:
```css
.problem {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 109px;
  background: #111;
  border: 2px solid #444;
  border-radius: 8px;
  padding: 0 24px;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 109px;
  background: #111;
  border: 2px dashed #333;
  border-radius: 8px;
  color: #555;
  font-size: 1rem;
}

.equation {
  display: flex;
  align-items: center;
  gap: 16px;
}

.number, .answer {
  font-size: 3rem;
  font-weight: 900;
  color: #fff;
}

.operator, .equals {
  font-size: 2.5rem;
  color: #888;
}

.answer {
  color: #e0c97f;
  min-width: 60px;
  text-align: center;
}

.shake {
  animation: shake 0.3s ease-in-out;
  border-color: #c0392b;
}

.correct {
  border-color: #27ae60;
  animation: flash 0.3s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}

@keyframes flash {
  0% { background: #1a3a1a; }
  100% { background: #111; }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ActionButton.jsx src/components/ActionButton.module.css src/components/MathProblem.jsx src/components/MathProblem.module.css
git commit -m "feat: add ActionButton and MathProblem components"
```

---

## Task 10: PotionPanel Component

**Files:**
- Create: `src/components/PotionPanel.jsx`
- Create: `src/components/PotionPanel.module.css`
- Create: `src/components/__tests__/PotionPanel.test.jsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/__tests__/PotionPanel.test.jsx`:
```jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PotionPanel from '../PotionPanel'

const defaultPotions = { attack: 1, shield: 1, magic: 1, aura: 1, slow: 1, heal: 1 }

describe('PotionPanel', () => {
  it('renders 6 potion buttons', () => {
    render(<PotionPanel potions={defaultPotions} onUse={() => {}} />)
    expect(screen.getAllByRole('button')).toHaveLength(6)
  })

  it('shows a potion as disabled when count is 0', () => {
    const potions = { ...defaultPotions, attack: 0 }
    render(<PotionPanel potions={potions} onUse={() => {}} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons[0]).toBeDisabled()
  })

  it('calls onUse with the potion type when clicked', async () => {
    const onUse = vi.fn()
    render(<PotionPanel potions={defaultPotions} onUse={onUse} />)
    await userEvent.click(screen.getAllByRole('button')[0])
    expect(onUse).toHaveBeenCalledWith('attack')
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/components/__tests__/PotionPanel.test.jsx
```
Expected: FAIL

- [ ] **Step 3: Implement PotionPanel**

Create `src/components/PotionPanel.jsx`:
```jsx
import styles from './PotionPanel.module.css'

const POTION_CONFIG = [
  { type: 'attack', label: 'ATK', icon: '⚔️', color: '#e74c3c' },
  { type: 'shield', label: 'DEF', icon: '🛡️', color: '#3498db' },
  { type: 'magic', label: 'MGC', icon: '✨', color: '#9b59b6' },
  { type: 'aura', label: 'AUR', icon: '🌟', color: '#f39c12' },
  { type: 'slow', label: 'SLW', icon: '🐢', color: '#1abc9c' },
  { type: 'heal', label: 'HEL', icon: '💚', color: '#27ae60' },
]

export default function PotionPanel({ potions, onUse, disabled }) {
  return (
    <div className={styles.panel}>
      {POTION_CONFIG.map(({ type, label, icon, color }) => {
        const count = potions[type]
        const isEmpty = count === 0
        return (
          <button
            key={type}
            className={`${styles.potion} ${isEmpty ? styles.empty : ''}`}
            style={!isEmpty ? { borderColor: color } : {}}
            onClick={() => !isEmpty && onUse(type)}
            disabled={isEmpty || disabled}
          >
            <span className={styles.potionIcon}>{icon}</span>
            <span className={styles.potionLabel}>{label}</span>
            <span className={styles.potionCount}>{count}</span>
          </button>
        )
      })}
    </div>
  )
}
```

Create `src/components/PotionPanel.module.css`:
```css
.panel {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 12px;
  padding: 24px;
  background: #1a1a1a;
  border: 2px solid #444;
  border-radius: 8px;
  width: 719px;
  height: 595px;
}

.potion {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #2a2a2a;
  border: 2px solid #555;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.1s;
  -webkit-user-select: none;
  user-select: none;
}

.potion:active:not(:disabled) {
  transform: scale(0.95);
}

.empty {
  opacity: 0.3;
  cursor: not-allowed;
}

.potionIcon {
  font-size: 2.5rem;
}

.potionLabel {
  font-size: 0.9rem;
  font-weight: 700;
  color: #ccc;
  letter-spacing: 0.1em;
}

.potionCount {
  font-size: 1.2rem;
  font-weight: 900;
  color: #fff;
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/components/__tests__/PotionPanel.test.jsx
```
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/PotionPanel.jsx src/components/PotionPanel.module.css src/components/__tests__/PotionPanel.test.jsx
git commit -m "feat: add PotionPanel component with 6 potion slots"
```

---

## Task 11: Assemble GamePage

**Files:**
- Modify: `src/components/GamePage.jsx`
- Create: `src/components/GamePage.module.css`

This task wires all components together using the three hooks. No new logic — just composition.

- [ ] **Step 1: Implement GamePage**

Replace `src/components/GamePage.jsx`:
```jsx
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
```

Create `src/components/GamePage.module.css`:
```css
.page {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  background: #0a0a0a;
  color: #fff;
  padding: 16px;
  gap: 16px;
  overflow: hidden;
}

.topRow {
  display: flex;
  align-items: center;
  gap: 16px;
}

.combatant {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.charLabel {
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #aaa;
}

.vsLabel {
  font-size: 1.5rem;
  font-weight: 900;
  color: #666;
  padding: 0 8px;
}

.statsRow {
  display: flex;
  align-items: center;
  gap: 16px;
}

.statPanel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #111;
  border: 2px solid #333;
  border-radius: 8px;
  padding: 16px;
}

.actionsRow {
  flex: 1;
}

.actionButtons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.actionRow {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bottomRow {
  display: flex;
  gap: 16px;
}

.potionProblem {
  position: fixed;
  bottom: 120px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  width: 600px;
}

.gameOver {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: #0a0a0a;
  color: #fff;
  text-align: center;
  gap: 16px;
}

.gameOver h1 {
  font-size: 4rem;
}

.gameOver p {
  font-size: 1.5rem;
  color: #aaa;
}
```

- [ ] **Step 2: Run all tests**

```bash
npx vitest run
```
Expected: All tests PASS.

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```
Open `http://localhost:5173` in browser. Verify:
- "FIGHT!" button leads to game page
- All 4 action buttons visible
- Timer counts down from 60
- Tapping Attack generates an addition problem
- NumPad digits appear in the problem panel
- Correct answer fills the Attack bar
- Wrong answer shakes the problem panel
- Enemy stat bars fill up autonomously
- Health bars visible for both player and enemy
- After 60s, combat resolves and health bars update

- [ ] **Step 4: Commit**

```bash
git add src/components/GamePage.jsx src/components/GamePage.module.css
git commit -m "feat: assemble GamePage — all components wired to hooks"
```

---

## Task 12: Run Full Test Suite + Final Verification

- [ ] **Step 1: Run all tests**

```bash
npx vitest run
```
Expected: All tests PASS. Zero failures.

- [ ] **Step 2: Build for production**

```bash
npm run build
```
Expected: Build succeeds with no errors. Output in `dist/`.

- [ ] **Step 3: Preview production build**

```bash
npm run preview
```
Open the preview URL. Verify game works end-to-end:
1. Start screen → tap FIGHT!
2. Game page loads, timer starts
3. Tap Attack → addition problem appears
4. Use numpad to answer → Attack bar fills
5. See enemy bars filling autonomously
6. Use Slow potion → enemy fills slower
7. Timer hits 0 → combat resolves → HP bars update
8. Next round begins with harder enemy
9. Fight until Game Over

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: math or die game page MVP complete"
```
