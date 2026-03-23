# UX Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement six playtesting improvements: speed ramping per campaign stage, difficulty renaming, a How to Play modal, a left/right split game layout for iPad, and keyboard number input.

**Architecture:** Eight independent tasks touching nine files. Tasks 1–3 (speed ramping) must be done in order. Tasks 4–8 are fully independent of each other and of Tasks 1–3.

**Tech Stack:** React 18 + Vite, CSS Modules, Vitest + React Testing Library. Test command: `npm test -- --run`. Canvas is 1640×2360px, CSS-scaled to iPad via `Math.min(window.innerWidth/1640, window.innerHeight/2360)`.

---

## File Structure

| File | What changes |
|------|-------------|
| `src/campaign.js` | Add `fillRateMult` to each STAGE entry |
| `src/hooks/useGameState.js` | Accept `fillRateMult` option; apply in `initialEnemy` + `startNextRound` |
| `src/App.jsx` | Pass `STAGES[campaignStage].fillRateMult` to `<GamePage>` |
| `src/components/GamePage.jsx` | Accept `fillRateMult` prop; redesign layout; add keyboard listener |
| `src/components/GamePage.module.css` | Full rewrite for left/right split layout |
| `src/components/ActionButton.module.css` | Remove fixed 480×155px; use `width:100%; flex:1` |
| `src/components/PotionPanel.module.css` | Remove fixed 719×595px; use `width:100%; height:280px` |
| `src/components/NumPad.module.css` | Remove fixed 738×595px; use `width:100%; flex:1`; rows get `flex:1` |
| `src/components/FrontPage.jsx` | Rename GRADES → DIFFICULTIES; add How to Play button |
| `src/components/MapPage.jsx` | Add How to Play button in header |
| `src/components/HowToPlay.jsx` | New modal component |
| `src/components/HowToPlay.module.css` | New modal styles |
| `src/hooks/__tests__/useGameState.test.js` | Add 2 new tests for fillRateMult |
| `src/components/__tests__/HowToPlay.test.jsx` | New test file |

---

## Task 1: Add fillRateMult to campaign stages

**Files:**
- Modify: `src/campaign.js`

- [ ] **Step 1: Update STAGES array**

Open `src/campaign.js`. The current `STAGES` array has entries like `{ id: 0, enemyHp: 20, label: 'Slime', boss: false }`. Add `fillRateMult` to each entry:

```js
export const STAGES = [
  { id: 0, enemyHp: 20, label: 'Slime',  boss: false, fillRateMult: 1.8 },
  { id: 1, enemyHp: 25, label: 'Goblin', boss: false, fillRateMult: 1.4 },
  { id: 2, enemyHp: 30, label: 'Orc',    boss: false, fillRateMult: 1.1 },
  { id: 3, enemyHp: 35, label: 'Troll',  boss: false, fillRateMult: 0.9 },
  { id: 4, enemyHp: 40, label: 'Knight', boss: false, fillRateMult: 0.75 },
  { id: 5, enemyHp: 60, label: 'BOSS',   boss: true,  fillRateMult: 0.65 },
]
```

- [ ] **Step 2: Run tests to verify no regression**

```bash
npm test -- --run
```

Expected: all 39 tests pass. `campaign.js` has no test file but is imported by others — no breakage expected.

- [ ] **Step 3: Commit**

```bash
git add src/campaign.js
git commit -m "feat: add fillRateMult to campaign stages for speed ramping"
```

---

## Task 2: Add fillRateMult to useGameState (TDD)

**Files:**
- Modify: `src/hooks/__tests__/useGameState.test.js`
- Modify: `src/hooks/useGameState.js`

- [ ] **Step 1: Write failing tests**

Open `src/hooks/__tests__/useGameState.test.js`. At the end of the `describe` block (after the last `it()`), add:

```js
it('respects custom fillRateMult on initial enemy', () => {
  const { result } = renderHook(() => useGameState(1, { fillRateMult: 1.8 }))
  expect(result.current.enemy.fillRate).toBe(5400) // 3000 * 1.8
})

it('applies fillRateMult when advancing to next round', () => {
  const { result } = renderHook(() => useGameState(1, { fillRateMult: 2.0 }))
  act(() => result.current.startNextRound())
  expect(result.current.enemy.fillRate).toBe(4400) // 2200 * 2.0
})
```

- [ ] **Step 2: Run tests — confirm both fail**

```bash
npm test -- --run
```

Expected: 39 pass, 2 fail. The 2 new tests fail because `fillRateMult` is not yet implemented.

- [ ] **Step 3: Implement fillRateMult in useGameState**

Open `src/hooks/useGameState.js`.

**3a.** Change the `initialEnemy` function signature to accept `mult`:

```js
function initialEnemy(round, hp = 20, mult = 1.0) {
  const diff = ENEMY_DIFFICULTY[Math.min(round, 4)]
  return {
    health: hp,
    attack: 0, shield: 0, magic: 0, aura: 0,
    fillRate: diff.fillRate * mult,
    slowedUntil: null,
    maxStats: diff.maxStats,
  }
}
```

**3b.** Change the `useGameState` signature to accept `fillRateMult`:

```js
export default function useGameState(grade, { enemyHp = 20, startingPotions = null, fillRateMult = 1.0 } = {}) {
```

**3c.** Add a ref to store the multiplier (add this right after the `playerRef` and `enemyRef` declarations at the top of the function body):

```js
const fillRateMultRef = useRef(fillRateMult)
```

**3d.** Update the `enemy` `useState` initialiser to pass `fillRateMult`:

```js
const [enemy, _setEnemy] = useState(() => {
  const e = initialEnemy(1, enemyHp, fillRateMult)
  enemyRef.current = e
  return e
})
```

**3e.** Update `startNextRound` to apply `fillRateMultRef.current` when escalating difficulty. Find the `startNextRound` callback and update the `setEnemy` call inside the `setRound` updater:

```js
const startNextRound = useCallback(() => {
  setRound(r => {
    const nextRound = r + 1
    const diff = ENEMY_DIFFICULTY[Math.min(nextRound, 4)]
    setEnemy(e => ({ ...e, fillRate: diff.fillRate * fillRateMultRef.current, maxStats: diff.maxStats }))
    return nextRound
  })
  resetRoundStats()
  setPhase('setup')
}, [resetRoundStats, setEnemy])
```

- [ ] **Step 4: Run tests — confirm all 41 pass**

```bash
npm test -- --run
```

Expected: 41 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useGameState.js src/hooks/__tests__/useGameState.test.js
git commit -m "feat: add fillRateMult to useGameState for per-stage speed ramping"
```

---

## Task 3: Wire fillRateMult through App.jsx and GamePage.jsx

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/components/GamePage.jsx`

No new tests — this is prop forwarding. The Task 2 tests already verify the logic.

- [ ] **Step 1: Update App.jsx to pass fillRateMult**

Open `src/App.jsx`. Find the `<GamePage ... />` JSX (currently inside the final `return` statement). Add the `fillRateMult` prop:

```jsx
return (
  <GamePage
    key={fightKey}
    grade={grade}
    enemyHp={STAGES[campaignStage].enemyHp}
    fillRateMult={STAGES[campaignStage].fillRateMult}
    startingPotions={potions}
    onVictory={handleVictory}
    onDefeat={handleDefeat}
  />
)
```

- [ ] **Step 2: Update GamePage.jsx to accept and forward fillRateMult**

Open `src/components/GamePage.jsx`. Change the function signature to accept `fillRateMult`:

```js
export default function GamePage({ grade = 1, enemyHp = 20, startingPotions = null, fillRateMult = 1.0, onVictory, onDefeat }) {
```

And update the `useGameState` call:

```js
const game = useGameState(grade, { enemyHp, startingPotions, fillRateMult })
```

- [ ] **Step 3: Run tests**

```bash
npm test -- --run
```

Expected: 41 tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx src/components/GamePage.jsx
git commit -m "feat: wire fillRateMult from campaign stages through App and GamePage"
```

---

## Task 4: Rename difficulty labels in FrontPage

**Files:**
- Modify: `src/components/FrontPage.jsx`

- [ ] **Step 1: Update FrontPage.jsx**

Open `src/components/FrontPage.jsx`. Replace the `GRADES` constant and the subtitle text:

```js
const DIFFICULTIES = [
  { grade: 1, label: 'Apprentice', ops: 'Addition',              icon: '🌱' },
  { grade: 2, label: 'Warrior',    ops: 'Addition & Subtraction', icon: '⚔️' },
  { grade: 3, label: 'Mage',       ops: 'Multiplication',         icon: '✨' },
  { grade: 4, label: 'Archmage',   ops: 'All Operations',         icon: '🌟' },
]
```

Change the subtitle from `"Choose your grade"` to `"Choose your difficulty"`.

Update the `.map()` call from `GRADES.map(...)` to `DIFFICULTIES.map(...)`.

- [ ] **Step 2: Run tests**

```bash
npm test -- --run
```

Expected: 41 pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/FrontPage.jsx
git commit -m "feat: rename grade labels to fantasy difficulty titles (Apprentice/Warrior/Mage/Archmage)"
```

---

## Task 5: Create HowToPlay component (TDD)

**Files:**
- Create: `src/components/HowToPlay.jsx`
- Create: `src/components/HowToPlay.module.css`
- Create: `src/components/__tests__/HowToPlay.test.jsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/__tests__/HowToPlay.test.jsx`:

```jsx
import { render, screen, fireEvent } from '@testing-library/react'
import HowToPlay from '../HowToPlay'

describe('HowToPlay', () => {
  it('renders game loop description', () => {
    render(<HowToPlay onClose={() => {}} />)
    expect(screen.getByText(/Survive all the rounds to win/i)).toBeInTheDocument()
  })

  it('renders all four action button descriptions', () => {
    render(<HowToPlay onClose={() => {}} />)
    expect(screen.getByText('Attack')).toBeInTheDocument()
    expect(screen.getByText('Shield')).toBeInTheDocument()
    expect(screen.getByText('Magic')).toBeInTheDocument()
    expect(screen.getByText('Aura')).toBeInTheDocument()
  })

  it('renders all six potion descriptions', () => {
    render(<HowToPlay onClose={() => {}} />)
    expect(screen.getByText('Attack Potion')).toBeInTheDocument()
    expect(screen.getByText('Heal Potion')).toBeInTheDocument()
    expect(screen.getByText('Slow Potion')).toBeInTheDocument()
  })

  it('calls onClose when Got it button is clicked', () => {
    const onClose = vi.fn()
    render(<HowToPlay onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /Got it/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run tests — confirm 4 new tests fail**

```bash
npm test -- --run
```

Expected: 41 pass, 4 fail.

- [ ] **Step 3: Create HowToPlay.jsx**

Create `src/components/HowToPlay.jsx`:

```jsx
import styles from './HowToPlay.module.css'

const ACTIONS = [
  { icon: '⚔',  name: 'Attack', math: 'Addition',       combat: 'Each point of attack deals 1 damage to the enemy (reduced by their Shield)' },
  { icon: '🛡',  name: 'Shield', math: 'Subtraction',    combat: 'Each point of shield absorbs 1 damage from the enemy\'s Attack' },
  { icon: '✨', name: 'Magic',  math: 'Multiplication', combat: 'Each point of magic deals 1 bonus damage (reduced by their Aura)' },
  { icon: '🌟', name: 'Aura',   math: 'Division',       combat: 'Each point of aura absorbs 1 damage from the enemy\'s Magic' },
]

const POTIONS = [
  { icon: '⚔️', name: 'Attack Potion', effect: '+3 Attack this round' },
  { icon: '🛡️', name: 'Shield Potion', effect: '+3 Shield this round' },
  { icon: '✨', name: 'Magic Potion',  effect: '+3 Magic this round' },
  { icon: '🌟', name: 'Aura Potion',   effect: '+3 Aura this round' },
  { icon: '🐢', name: 'Slow Potion',   effect: 'Slows the enemy for 15 seconds' },
  { icon: '💚', name: 'Heal Potion',   effect: 'Restore 5 HP (max 20)' },
]

export default function HowToPlay({ onClose }) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <h2 className={styles.title}>How to Play</h2>

        <p className={styles.intro}>
          Pick an action, solve a maths problem, and build your stats before time runs out.
          When the timer hits zero, combat resolves — your attack hits the enemy, their attack hits you.
          Survive all the rounds to win!
        </p>

        <h3 className={styles.section}>Action Buttons</h3>
        {ACTIONS.map(a => (
          <div key={a.name} className={styles.row}>
            <span className={styles.icon}>{a.icon}</span>
            <div className={styles.rowBody}>
              <div className={styles.rowName}>{a.name} <span className={styles.math}>— {a.math}</span></div>
              <div className={styles.rowDesc}>{a.combat}</div>
            </div>
          </div>
        ))}

        <h3 className={styles.section}>Potions</h3>
        {POTIONS.map(p => (
          <div key={p.name} className={styles.row}>
            <span className={styles.icon}>{p.icon}</span>
            <div className={styles.rowBody}>
              <div className={styles.rowName}>{p.name}</div>
              <div className={styles.rowDesc}>{p.effect}</div>
            </div>
          </div>
        ))}

        <button className={styles.closeBtn} onClick={onClose}>Got it! ✓</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create HowToPlay.module.css**

Create `src/components/HowToPlay.module.css`:

```css
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.92);
  z-index: 100;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow-y: auto;
  padding: 40px 16px;
}

.panel {
  background: #111;
  border: 2px solid #333;
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.title {
  font-size: 2rem;
  font-weight: 900;
  color: #f1c40f;
  text-shadow: 0 0 20px #f1c40f44;
  letter-spacing: 0.06em;
  margin: 0;
  text-align: center;
}

.intro {
  font-size: 1rem;
  color: #ccc;
  line-height: 1.6;
  margin: 0;
  text-align: center;
}

.section {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #666;
  margin: 8px 0 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #222;
}

.row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.icon {
  font-size: 1.8rem;
  width: 36px;
  text-align: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.rowBody {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rowName {
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
}

.math {
  font-weight: 400;
  color: #888;
  font-size: 0.9rem;
}

.rowDesc {
  font-size: 0.9rem;
  color: #aaa;
  line-height: 1.4;
}

.closeBtn {
  margin-top: 16px;
  padding: 18px 48px;
  font-size: 1.2rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  background: #27ae60;
  color: #fff;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
  align-self: center;
  -webkit-user-select: none;
  user-select: none;
}

.closeBtn:active {
  background: #1e8449;
  transform: scale(0.97);
}
```

- [ ] **Step 5: Run tests — confirm all 45 pass**

```bash
npm test -- --run
```

Expected: 45 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/HowToPlay.jsx src/components/HowToPlay.module.css src/components/__tests__/HowToPlay.test.jsx
git commit -m "feat: add HowToPlay modal with action and potion descriptions"
```

---

## Task 6: Add How to Play button to FrontPage and MapPage

**Files:**
- Modify: `src/components/FrontPage.jsx`
- Modify: `src/components/FrontPage.module.css`
- Modify: `src/components/MapPage.jsx`
- Modify: `src/components/MapPage.module.css`

- [ ] **Step 1: Update FrontPage.jsx**

Open `src/components/FrontPage.jsx`. Add the import and state:

```js
import HowToPlay from './HowToPlay'
```

Add `showHelp` state inside the component:

```js
const [showHelp, setShowHelp] = useState(false)
```

Add a "How to Play" button and conditional render of `<HowToPlay>`. Place the button below the grade buttons and above the FIGHT! button in the JSX:

```jsx
<button className={styles.helpBtn} onClick={() => setShowHelp(true)}>
  ? How to Play
</button>

{showHelp && <HowToPlay onClose={() => setShowHelp(false)} />}
```

- [ ] **Step 2: Add helpBtn style to FrontPage.module.css**

Open `src/components/FrontPage.module.css`. Add at the end:

```css
.helpBtn {
  padding: 12px 32px;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  background: transparent;
  color: #666;
  border: 2px solid #333;
  border-radius: 8px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
  -webkit-user-select: none;
  user-select: none;
}

.helpBtn:hover {
  color: #aaa;
  border-color: #555;
}
```

- [ ] **Step 3: Update MapPage.jsx**

Open `src/components/MapPage.jsx`. Add import at top:

```js
import HowToPlay from './HowToPlay'
```

Add state inside the component:

```js
const [showHelp, setShowHelp] = useState(false)
```

Inside the existing `.header` div (which contains the title and subtitle), add the button and conditional modal after the subtitle `<p>`:

```jsx
<div className={styles.header}>
  <h1 className={styles.title}>WORLD MAP</h1>
  <p className={styles.subtitle}>Stage {currentStage + 1} of {STAGES.length}</p>
  <button className={styles.helpBtn} onClick={() => setShowHelp(true)}>
    ? How to Play
  </button>
</div>
{showHelp && <HowToPlay onClose={() => setShowHelp(false)} />}
```

- [ ] **Step 4: Add helpBtn style to MapPage.module.css**

Open `src/components/MapPage.module.css`. Add at the end:

```css
.helpBtn {
  margin-top: 16px;
  padding: 12px 32px;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  background: transparent;
  color: #666;
  border: 2px solid #333;
  border-radius: 8px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
  -webkit-user-select: none;
  user-select: none;
}

.helpBtn:hover {
  color: #aaa;
  border-color: #555;
}
```

- [ ] **Step 5: Run tests**

```bash
npm test -- --run
```

Expected: 45 pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/FrontPage.jsx src/components/FrontPage.module.css src/components/MapPage.jsx src/components/MapPage.module.css
git commit -m "feat: add How to Play button to FrontPage and MapPage"
```

---

## Task 7: Redesign GamePage layout (left/right split)

**Files:**
- Modify: `src/components/GamePage.jsx`
- Modify: `src/components/GamePage.module.css`
- Modify: `src/components/ActionButton.module.css`
- Modify: `src/components/PotionPanel.module.css`
- Modify: `src/components/NumPad.module.css`

This is a full layout rewrite. No existing unit tests cover the layout (no snapshot tests). Run the full suite before and after to confirm nothing breaks.

- [ ] **Step 1: Verify current test count**

```bash
npm test -- --run
```

Note the passing count (45). This is the baseline to maintain.

- [ ] **Step 2: Rewrite GamePage.module.css**

Replace the entire contents of `src/components/GamePage.module.css` with:

```css
/* ── Root page canvas (1640×2360, scaled via inline style) ── */
.page {
  display: flex;
  flex-direction: column;
  width: 1640px;
  height: 2360px;
  background: #0a0a0a;
  color: #fff;
  overflow: hidden;
  transform-origin: top left;
}

/* ── Top strip: profiles + health bars + stat bars + timer ── */
.topStrip {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 16px 0;
  flex-shrink: 0;
}

.combatantCompact {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  width: 220px;
}

.profilePic {
  width: 140px;
  height: 140px;
  image-rendering: pixelated;
  border: 3px solid #333;
  border-radius: 6px;
  background: #111;
}

.charLabel {
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #aaa;
}

.statPanel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: #111;
  border: 2px solid #333;
  border-radius: 8px;
  padding: 12px;
}

/* ── Main area: left col (actions) + right col (numpad) ── */
.mainArea {
  flex: 1;
  display: flex;
  min-height: 0;
}

.leftCol {
  width: 640px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  overflow: hidden;
}

.rightCol {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px 16px 16px 0;
  min-height: 0;
}

.actionButtons {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mathArea {
  flex-shrink: 0;
}

/* ── Game over screen ── */
.gameOver {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #0a0a0a;
  color: #fff;
  text-align: center;
  gap: 32px;
  transform-origin: top left;
}

.gameOverPic {
  width: 200px;
  height: 200px;
  image-rendering: pixelated;
  border: 4px solid #333;
  border-radius: 8px;
}

.victoryTitle {
  font-size: 5rem;
  font-weight: 900;
  color: #f1c40f;
  text-shadow: 0 0 40px #f1c40f88;
  letter-spacing: 0.05em;
}

.defeatTitle {
  font-size: 5rem;
  font-weight: 900;
  color: #e74c3c;
  text-shadow: 0 0 40px #e74c3c88;
  letter-spacing: 0.05em;
}

.gameOverSub {
  font-size: 1.8rem;
  color: #aaa;
}

.statsSummary {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #111;
  border: 2px solid #333;
  border-radius: 12px;
  padding: 32px 48px;
  min-width: 500px;
}

.statRow {
  display: flex;
  align-items: center;
  gap: 24px;
  font-size: 1.6rem;
}

.statRow span:first-child {
  font-size: 2rem;
  width: 40px;
  text-align: center;
}

.statRow span:nth-child(2) {
  flex: 1;
  text-align: left;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
}

.statRow span:last-child {
  font-size: 2rem;
  font-weight: 900;
  color: #fff;
  min-width: 60px;
  text-align: right;
}

.statTotal {
  border-top: 1px solid #333;
  padding-top: 12px;
  margin-top: 4px;
}

.statTotal span:nth-child(2) { color: #fff; }
.statTotal span:last-child { color: #f1c40f; font-size: 2.2rem; }

.restartBtn {
  margin-top: 16px;
  padding: 28px 80px;
  font-size: 2rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: #27ae60;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
  -webkit-user-select: none;
  user-select: none;
}

.restartBtn:active { background: #1e8449; transform: scale(0.97); }
.defeatBtn { background: #c0392b; }
.defeatBtn:active { background: #96281b; }
```

- [ ] **Step 3: Rewrite the GamePage.jsx layout JSX**

Open `src/components/GamePage.jsx`. **Keep the game-over `if` block unchanged.** Replace only the final `return (...)` statement (the main game screen, starting from `return (` and ending at the closing `)`) with:

```jsx
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

        <PotionPanel
          potions={game.player.potions}
          onUse={handlePotionUse}
          disabled={game.phase !== 'setup'}
        />
      </div>

      {/* Right column: numpad */}
      <div className={styles.rightCol}>
        <NumPad
          onDigit={handleDigit}
          onBackspace={handleBackspace}
          disabled={!game.activeQuestion || game.phase !== 'setup'}
        />
      </div>
    </div>
  </div>
)
```

Note: the old `actionRow` div, the `vsLabel`, `statsRow`, `actionsRow`, `bottomRow`, and `potionProblem` elements are all gone. The `MathProblem` now renders once in a fixed `.mathArea` whenever `game.activeQuestion` is set (covers both action and potion questions).

- [ ] **Step 4: Update ActionButton.module.css to fill container**

Open `src/components/ActionButton.module.css`. Change `.button` to be fluid:

```css
.button {
  display: flex;
  align-items: center;
  gap: 20px;
  width: 100%;
  flex: 1;
  padding: 0 32px;
  background: #1a1a1a;
  border: 3px solid #444;
  border-radius: 12px;
  color: #fff;
  font-size: 1.5rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.1s;
  -webkit-user-select: none;
  user-select: none;
}
```

(Remove `height: 155px;` and `width: 480px;`. Add `flex: 1;`.)

- [ ] **Step 5: Update PotionPanel.module.css to fill container**

Open `src/components/PotionPanel.module.css`. Change `.panel` to be fluid:

```css
.panel {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 8px;
  padding: 16px;
  background: #1a1a1a;
  border: 2px solid #444;
  border-radius: 8px;
  width: 100%;
  height: 280px;
  flex-shrink: 0;
}
```

(Remove `width: 719px; height: 595px; padding: 24px;`. Add `width: 100%; height: 280px; flex-shrink: 0;`.)

- [ ] **Step 6: Update NumPad.module.css to fill container**

Open `src/components/NumPad.module.css`. Update:

```css
.numPad {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 24px;
  background: #1a1a1a;
  border: 2px solid #444;
  border-radius: 8px;
  width: 100%;
  flex: 1;
  min-height: 0;
  justify-content: stretch;
}

.row {
  display: flex;
  gap: 8px;
  flex: 1;
}

.key {
  flex: 1;
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

.backspace {
  background: #3a1a1a;
  border-color: #c0392b;
  color: #c0392b;
}
```

(Remove `width: 738px; height: 595px;` from `.numPad`. Remove `height: 118px;` from `.key`. Add `flex: 1` to `.row`.)

- [ ] **Step 7: Run tests**

```bash
npm test -- --run
```

Expected: 45 pass. (No snapshot tests exist for GamePage — all tests are unit tests for hooks and individual components.)

- [ ] **Step 8: Commit**

```bash
git add src/components/GamePage.jsx src/components/GamePage.module.css src/components/ActionButton.module.css src/components/PotionPanel.module.css src/components/NumPad.module.css
git commit -m "feat: redesign GamePage to left/right split layout for iPad"
```

---

## Task 8: Add keyboard number input to GamePage

**Files:**
- Modify: `src/components/GamePage.jsx`

- [ ] **Step 1: Add keydown listener to GamePage.jsx**

Open `src/components/GamePage.jsx`. The file already has several `useEffect` calls. Add a new one after the existing viewport scale `useEffect` (or after the cleanup timer `useEffect` — position doesn't matter):

```js
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
```

The `handleDigit` and `handleBackspace` functions are already defined in the file as `useCallback` — they are valid dependencies.

Note: `game.activeQuestion` and `game.phase` are included as dependencies so the guard condition always reflects current state.

- [ ] **Step 2: Run tests**

```bash
npm test -- --run
```

Expected: 45 pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/GamePage.jsx
git commit -m "feat: add keyboard number input (0-9, Backspace) to game"
```

---

## Final Verification

- [ ] **Run full test suite**

```bash
npm test -- --run
```

Expected: 45 tests pass across 8 test files.

- [ ] **Push to origin**

```bash
git push
```
