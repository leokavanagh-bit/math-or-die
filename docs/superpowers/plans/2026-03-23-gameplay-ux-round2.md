# Gameplay UX Round 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Four playtesting improvements: move the math problem above the numpad, add a tap-to-continue pause between rounds, give each enemy a distinct portrait, and grey out Magic/Aura for grades 1–2.

**Architecture:** Four independent tasks, all touching `GamePage.jsx`. Tasks 1–3 are structural changes with no new unit tests. Task 4 (locked actions) is the only TDD task — it adds `locked` props to `ActionButton` and `PotionPanel`.

**Tech Stack:** React 18 + Vite, CSS Modules, Vitest + React Testing Library. Test command: `npm test -- --run` from project root. Current passing count: 53.

---

## File Structure

| File | What changes |
|------|-------------|
| `src/components/GamePage.jsx` | Move mathArea to rightCol; add roundEnd render; accept `enemyProfilePic`; locked action logic |
| `src/components/GamePage.module.css` | Update `.mathArea`; add `.roundEnd` family + `.readyBtn` |
| `src/components/MathProblem.module.css` | Increase font sizes for larger display in right column |
| `src/components/ActionButton.jsx` | Add `locked` prop, lock badge, locked class |
| `src/components/ActionButton.module.css` | Add `.locked` and `.lockBadge` styles |
| `src/components/PotionPanel.jsx` | Add `lockedTypes` prop; apply locked style per slot |
| `src/components/PotionPanel.module.css` | Add `.locked` style |
| `src/campaign.js` | Add `profilePic` field to each STAGE entry |
| `src/App.jsx` | Pass `enemyProfilePic={STAGES[campaignStage].profilePic}` |
| `public/PROFILE_PIC_PLAYER.svg` | Replace with new player portrait |
| `public/ENEMY_SLIME.svg` | New — green blob |
| `public/ENEMY_GOBLIN.svg` | New — green pointy-eared face |
| `public/ENEMY_ORC.svg` | New — dark green heavy face |
| `public/ENEMY_TROLL.svg` | New — grey rocky face |
| `public/ENEMY_KNIGHT.svg` | New — silver helmet |
| `public/ENEMY_BOSS.svg` | New — purple crowned face |
| `src/components/__tests__/ActionButton.test.jsx` | New — test `locked` prop |
| `src/components/__tests__/PotionPanel.test.jsx` | Add — test `lockedTypes` prop |

---

## Task 1: Move Math Problem to Right Column

**Files:**
- Modify: `src/components/GamePage.jsx`
- Modify: `src/components/GamePage.module.css`
- Modify: `src/components/MathProblem.module.css`

No new unit tests — no GamePage test file exists and this is a layout-only change.

- [ ] **Step 1: Move mathArea in GamePage.jsx**

Open `src/components/GamePage.jsx`. Find the `.rightCol` div (currently contains only `<NumPad ...>`). Move the `{game.activeQuestion && ...}` math block from `.leftCol` into `.rightCol`, placing it **above** `<NumPad>`:

```jsx
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
```

Also remove the now-empty `{game.activeQuestion && <div className={styles.mathArea}>...}` block from `.leftCol`.

- [ ] **Step 2: Update .mathArea in GamePage.module.css**

Find `.mathArea` in `src/components/GamePage.module.css`. Replace with:

```css
.mathArea {
  flex-shrink: 0;
  padding: 0 16px 8px;
}
```

- [ ] **Step 3: Increase font sizes in MathProblem.module.css**

Open `src/components/MathProblem.module.css`. Update the following rules:

```css
.problem {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 180px;
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
  height: 180px;
  background: #111;
  border: 2px dashed #333;
  border-radius: 8px;
  color: #555;
  font-size: 1.2rem;
}

.number, .answer {
  font-size: 4.5rem;
  font-weight: 900;
  color: #fff;
}

.operator, .equals {
  font-size: 3.5rem;
  color: #888;
}
```

Leave `.answer`, `.shake`, `.correct`, and keyframes unchanged.

- [ ] **Step 4: Run tests**

```bash
npm test -- --run
```

Expected: 53 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/GamePage.jsx src/components/GamePage.module.css src/components/MathProblem.module.css
git commit -m "feat: move math problem to right column above numpad, increase size"
```

---

## Task 2: Round Pause — Tap to Continue

**Files:**
- Modify: `src/components/GamePage.jsx`
- Modify: `src/components/GamePage.module.css`

No new unit tests — `useGameState`'s `roundEnd` phase is already tested; the render change has no test file.

- [ ] **Step 1: Simplify handleTimerExpire in GamePage.jsx**

Open `src/components/GamePage.jsx`. Find `handleTimerExpire` (currently has a `setTimeout` that calls `audio.startMusic()` and `game.startNextRound()`). Replace the entire callback with:

```js
const handleTimerExpire = useCallback(() => {
  game.resolveCombat()
}, [game])
```

The `audio.startMusic()` and `game.startNextRound()` calls move to the Ready button (next step).

- [ ] **Step 2: Add roundEnd render block in GamePage.jsx**

In `GamePage.jsx`, add the following block **immediately before** the `if (game.phase === 'gameOver')` block:

```jsx
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
```

Note: `audio` and `game` are both in scope (defined earlier in the component). `audio.startMusic()` intentionally restarts the music from beat 0 at each round — this is correct behaviour matching the old auto-advance code.

- [ ] **Step 3: Add CSS for roundEnd screen in GamePage.module.css**

Open `src/components/GamePage.module.css`. Add at the end (before `.gameOver` if present, or at the end of the file):

```css
/* ── Round interstitial ── */
.roundEnd {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #0a0a0a;
  color: #fff;
  text-align: center;
  gap: 24px;
  transform-origin: top left;
}

.roundEndSub {
  font-size: 1.4rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #666;
}

.roundEndTitle {
  font-size: 6rem;
  font-weight: 900;
  color: #f1c40f;
  text-shadow: 0 0 40px #f1c40f66;
  letter-spacing: 0.04em;
}

.roundEndPrompt {
  font-size: 2rem;
  color: #aaa;
}

.readyBtn {
  margin-top: 8px;
  padding: 28px 80px;
  font-size: 2rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: #27ae60;
  color: #fff;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
  -webkit-user-select: none;
  user-select: none;
}

.readyBtn:active {
  background: #1e8449;
  transform: scale(0.97);
}
```

- [ ] **Step 4: Run tests**

```bash
npm test -- --run
```

Expected: 53 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/GamePage.jsx src/components/GamePage.module.css
git commit -m "feat: add tap-to-continue round pause between rounds"
```

---

## Task 3: Enemy Profile Pictures

**Files:**
- Create: `public/PROFILE_PIC_PLAYER.svg` (replace)
- Create: `public/ENEMY_SLIME.svg`
- Create: `public/ENEMY_GOBLIN.svg`
- Create: `public/ENEMY_ORC.svg`
- Create: `public/ENEMY_TROLL.svg`
- Create: `public/ENEMY_KNIGHT.svg`
- Create: `public/ENEMY_BOSS.svg`
- Modify: `src/campaign.js`
- Modify: `src/App.jsx`
- Modify: `src/components/GamePage.jsx`

No new unit tests — SVG files have no testable JS, and the prop-forwarding is trivial.

- [ ] **Step 1: Create SVG portrait files**

All SVGs use `viewBox="0 0 80 80"` with no explicit `width`/`height` (sized by CSS). Create each file:

**`public/PROFILE_PIC_PLAYER.svg`** (replace existing):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <rect width="80" height="80" fill="#111"/>
  <circle cx="40" cy="28" r="16" fill="#f39c12"/>
  <rect x="20" y="46" width="40" height="28" rx="6" fill="#3498db"/>
  <circle cx="32" cy="26" r="3" fill="#222"/>
  <circle cx="48" cy="26" r="3" fill="#222"/>
  <path d="M33 34 Q40 39 47 34" stroke="#222" stroke-width="2" fill="none"/>
</svg>
```

**`public/ENEMY_SLIME.svg`**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <rect width="80" height="80" fill="#111"/>
  <ellipse cx="40" cy="50" rx="28" ry="22" fill="#2ecc71"/>
  <ellipse cx="40" cy="46" rx="22" ry="18" fill="#27ae60"/>
  <circle cx="33" cy="44" r="4" fill="#1a7a40"/>
  <circle cx="47" cy="44" r="4" fill="#1a7a40"/>
  <circle cx="34" cy="43" r="1.5" fill="#fff"/>
  <circle cx="48" cy="43" r="1.5" fill="#fff"/>
  <path d="M35 52 Q40 56 45 52" stroke="#1a7a40" stroke-width="2" fill="none"/>
  <ellipse cx="24" cy="34" rx="5" ry="7" fill="#2ecc71"/>
  <ellipse cx="40" cy="28" rx="5" ry="8" fill="#2ecc71"/>
  <ellipse cx="56" cy="34" rx="5" ry="7" fill="#2ecc71"/>
</svg>
```

**`public/ENEMY_GOBLIN.svg`**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <rect width="80" height="80" fill="#111"/>
  <ellipse cx="40" cy="38" rx="18" ry="20" fill="#8bc34a"/>
  <polygon points="22,26 16,10 28,22" fill="#8bc34a"/>
  <polygon points="58,26 64,10 52,22" fill="#8bc34a"/>
  <circle cx="33" cy="36" r="4" fill="#1a3a00"/>
  <circle cx="47" cy="36" r="4" fill="#1a3a00"/>
  <circle cx="34" cy="35" r="1.5" fill="#ffeb3b"/>
  <circle cx="48" cy="35" r="1.5" fill="#ffeb3b"/>
  <ellipse cx="40" cy="46" rx="6" ry="4" fill="#6a9e30"/>
  <path d="M34 50 L37 55 L40 50 L43 55 L46 50" stroke="#1a3a00" stroke-width="1.5" fill="none"/>
  <rect x="34" y="56" width="12" height="14" rx="4" fill="#5d4037"/>
</svg>
```

**`public/ENEMY_ORC.svg`**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <rect width="80" height="80" fill="#111"/>
  <ellipse cx="40" cy="36" rx="22" ry="24" fill="#4caf50"/>
  <ellipse cx="40" cy="36" rx="20" ry="22" fill="#388e3c"/>
  <circle cx="32" cy="32" r="5" fill="#1b5e20"/>
  <circle cx="48" cy="32" r="5" fill="#1b5e20"/>
  <circle cx="33" cy="31" r="2" fill="#f44336"/>
  <circle cx="49" cy="31" r="2" fill="#f44336"/>
  <ellipse cx="40" cy="42" rx="8" ry="5" fill="#2e7d32"/>
  <line x1="34" y1="48" x2="32" y2="56" stroke="#1b5e20" stroke-width="2"/>
  <line x1="46" y1="48" x2="48" y2="56" stroke="#1b5e20" stroke-width="2"/>
  <rect x="26" y="58" width="28" height="16" rx="5" fill="#795548"/>
  <rect x="26" y="58" width="28" height="6" rx="3" fill="#546e7a"/>
</svg>
```

**`public/ENEMY_TROLL.svg`**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <rect width="80" height="80" fill="#111"/>
  <ellipse cx="40" cy="40" rx="26" ry="28" fill="#78909c"/>
  <ellipse cx="40" cy="40" rx="24" ry="26" fill="#607d8b"/>
  <ellipse cx="40" cy="30" rx="14" ry="8" fill="#546e7a"/>
  <circle cx="32" cy="38" r="5" fill="#263238"/>
  <circle cx="48" cy="38" r="5" fill="#263238"/>
  <circle cx="33" cy="37" r="2" fill="#80cbc4"/>
  <circle cx="49" cy="37" r="2" fill="#80cbc4"/>
  <ellipse cx="40" cy="50" rx="10" ry="6" fill="#546e7a"/>
  <rect x="36" y="44" width="3" height="8" rx="1" fill="#eceff1"/>
  <rect x="41" y="44" width="3" height="8" rx="1" fill="#eceff1"/>
  <ellipse cx="28" cy="32" rx="6" ry="4" fill="#78909c" transform="rotate(-20,28,32)"/>
  <ellipse cx="52" cy="32" rx="6" ry="4" fill="#78909c" transform="rotate(20,52,32)"/>
</svg>
```

**`public/ENEMY_KNIGHT.svg`**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <rect width="80" height="80" fill="#111"/>
  <ellipse cx="40" cy="38" rx="22" ry="24" fill="#bdbdbd"/>
  <ellipse cx="40" cy="38" rx="20" ry="22" fill="#9e9e9e"/>
  <rect x="20" y="24" width="40" height="28" rx="4" fill="#757575"/>
  <rect x="24" y="28" width="14" height="10" rx="2" fill="#1a237e" opacity="0.8"/>
  <rect x="42" y="28" width="14" height="10" rx="2" fill="#1a237e" opacity="0.8"/>
  <rect x="22" y="20" width="36" height="12" rx="6" fill="#616161"/>
  <rect x="28" y="22" width="24" height="7" rx="3" fill="#f5f5f5" opacity="0.3"/>
  <rect x="36" y="38" width="8" height="14" rx="2" fill="#616161"/>
  <rect x="26" y="52" width="28" height="18" rx="4" fill="#757575"/>
  <line x1="40" y1="52" x2="40" y2="70" stroke="#616161" stroke-width="2"/>
  <line x1="26" y1="61" x2="54" y2="61" stroke="#616161" stroke-width="2"/>
</svg>
```

**`public/ENEMY_BOSS.svg`**:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <rect width="80" height="80" fill="#111"/>
  <ellipse cx="40" cy="42" rx="24" ry="26" fill="#4a148c"/>
  <ellipse cx="40" cy="42" rx="22" ry="24" fill="#6a1b9a"/>
  <polygon points="40,4 46,18 34,18" fill="#f1c40f"/>
  <polygon points="28,8 32,20 20,16" fill="#f1c40f"/>
  <polygon points="52,8 60,16 48,20" fill="#f1c40f"/>
  <circle cx="32" cy="38" r="6" fill="#1a0033"/>
  <circle cx="48" cy="38" r="6" fill="#1a0033"/>
  <circle cx="33" cy="37" r="2.5" fill="#f44336"/>
  <circle cx="49" cy="37" r="2.5" fill="#f44336"/>
  <path d="M30 50 Q40 58 50 50" stroke="#f1c40f" stroke-width="2.5" fill="none"/>
  <line x1="32" y1="54" x2="30" y2="62" stroke="#f1c40f" stroke-width="1.5"/>
  <line x1="40" y1="56" x2="40" y2="64" stroke="#f1c40f" stroke-width="1.5"/>
  <line x1="48" y1="54" x2="50" y2="62" stroke="#f1c40f" stroke-width="1.5"/>
</svg>
```

- [ ] **Step 2: Add profilePic to campaign.js**

Open `src/campaign.js`. Replace the STAGES array with:

```js
export const STAGES = [
  { id: 0, enemyHp: 20, label: 'Slime',  boss: false, fillRateMult: 1.8,  profilePic: '/ENEMY_SLIME.svg'  },
  { id: 1, enemyHp: 25, label: 'Goblin', boss: false, fillRateMult: 1.4,  profilePic: '/ENEMY_GOBLIN.svg' },
  { id: 2, enemyHp: 30, label: 'Orc',    boss: false, fillRateMult: 1.1,  profilePic: '/ENEMY_ORC.svg'    },
  { id: 3, enemyHp: 35, label: 'Troll',  boss: false, fillRateMult: 0.9,  profilePic: '/ENEMY_TROLL.svg'  },
  { id: 4, enemyHp: 40, label: 'Knight', boss: false, fillRateMult: 0.75, profilePic: '/ENEMY_KNIGHT.svg' },
  { id: 5, enemyHp: 60, label: 'BOSS',   boss: true,  fillRateMult: 0.65, profilePic: '/ENEMY_BOSS.svg'   },
]
```

- [ ] **Step 3: Pass enemyProfilePic in App.jsx**

Open `src/App.jsx`. Find the `<GamePage ... />` JSX. Add the `enemyProfilePic` prop:

```jsx
<GamePage
  key={fightKey}
  grade={grade}
  enemyHp={STAGES[campaignStage].enemyHp}
  fillRateMult={STAGES[campaignStage].fillRateMult}
  enemyProfilePic={STAGES[campaignStage].profilePic}
  startingPotions={potions}
  onVictory={handleVictory}
  onDefeat={handleDefeat}
/>
```

- [ ] **Step 4: Accept and use enemyProfilePic in GamePage.jsx**

Open `src/components/GamePage.jsx`. Update the function signature to accept the new prop with a safe default:

```js
export default function GamePage({ grade = 1, enemyHp = 20, startingPotions = null, fillRateMult = 1.0, enemyProfilePic = '/PROFILE_PIC_ENEMY.svg', onVictory, onDefeat })
```

Then replace **both** occurrences of the hardcoded `'/PROFILE_PIC_ENEMY.svg'` string with `{enemyProfilePic}`:

1. In the top strip `.combatantCompact` (enemy side):
```jsx
<img src={enemyProfilePic} className={styles.profilePic} alt="Enemy" />
```

2. In the `gameOver` defeat branch:
```jsx
<img src={won ? '/PROFILE_PIC_PLAYER.svg' : enemyProfilePic} ... />
```

- [ ] **Step 5: Run tests**

```bash
npm test -- --run
```

Expected: 53 tests pass.

- [ ] **Step 6: Commit**

```bash
git add public/PROFILE_PIC_PLAYER.svg public/ENEMY_SLIME.svg public/ENEMY_GOBLIN.svg public/ENEMY_ORC.svg public/ENEMY_TROLL.svg public/ENEMY_KNIGHT.svg public/ENEMY_BOSS.svg src/campaign.js src/App.jsx src/components/GamePage.jsx
git commit -m "feat: add distinct enemy SVG portraits per campaign stage"
```

---

## Task 4: Locked Actions for Grades 1–2

**Files:**
- Modify: `src/components/ActionButton.jsx`
- Modify: `src/components/ActionButton.module.css`
- Modify: `src/components/PotionPanel.jsx`
- Modify: `src/components/PotionPanel.module.css`
- Modify: `src/components/GamePage.jsx`
- Create: `src/components/__tests__/ActionButton.test.jsx`
- Modify: `src/components/__tests__/PotionPanel.test.jsx`

- [ ] **Step 1: Write failing tests for ActionButton**

Create `src/components/__tests__/ActionButton.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ActionButton from '../ActionButton'

describe('ActionButton', () => {
  it('renders label and icon', () => {
    render(<ActionButton label="Attack" icon="⚔" color="#e74c3c" onClick={() => {}} />)
    expect(screen.getByText('Attack')).toBeInTheDocument()
    expect(screen.getByText('⚔')).toBeInTheDocument()
  })

  it('calls onClick when clicked and not locked', async () => {
    const onClick = vi.fn()
    render(<ActionButton label="Attack" icon="⚔" color="#e74c3c" onClick={onClick} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled and shows lock badge when locked=true', () => {
    render(<ActionButton label="Magic" icon="✨" color="#9b59b6" locked={true} onClick={() => {}} />)
    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByText('🔒')).toBeInTheDocument()
  })

  it('does not call onClick when locked', async () => {
    const onClick = vi.fn()
    render(<ActionButton label="Magic" icon="✨" color="#9b59b6" locked={true} onClick={onClick} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests — confirm 4 new tests fail**

```bash
npm test -- --run
```

Expected: 53 pass, 4 fail (ActionButton tests fail because `locked` prop doesn't exist yet).

- [ ] **Step 3: Write failing tests for PotionPanel lockedTypes**

Open `src/components/__tests__/PotionPanel.test.jsx`. Add these two tests inside the existing `describe('PotionPanel', ...)` block:

```jsx
  it('disables potion buttons for lockedTypes', () => {
    render(<PotionPanel potions={defaultPotions} onUse={() => {}} lockedTypes={['magic', 'aura']} />)
    const buttons = screen.getAllByRole('button')
    // POTION_CONFIG order: attack(0), shield(1), magic(2), aura(3), slow(4), heal(5)
    expect(buttons[2]).toBeDisabled()
    expect(buttons[3]).toBeDisabled()
    expect(buttons[0]).not.toBeDisabled()
  })

  it('does not call onUse for a locked potion type', async () => {
    const onUse = vi.fn()
    render(<PotionPanel potions={defaultPotions} onUse={onUse} lockedTypes={['magic']} />)
    const buttons = screen.getAllByRole('button')
    await userEvent.click(buttons[2]) // magic
    expect(onUse).not.toHaveBeenCalled()
  })
```

- [ ] **Step 4: Run tests — confirm 6 new tests fail**

```bash
npm test -- --run
```

Expected: 53 pass, 6 fail.

- [ ] **Step 5: Implement locked prop in ActionButton.jsx**

Open `src/components/ActionButton.jsx`. Replace the entire file:

```jsx
import styles from './ActionButton.module.css'

export default function ActionButton({ label, icon, color, isActive, onClick, disabled, locked = false }) {
  return (
    <button
      className={`${styles.button} ${isActive ? styles.active : ''} ${locked ? styles.locked : ''}`}
      style={isActive ? { borderColor: color, boxShadow: `0 0 12px ${color}` } : {}}
      onClick={onClick}
      disabled={disabled || locked}
    >
      <span className={styles.icon}>{icon}</span>
      <span className={styles.label}>{label}</span>
      {locked && <span className={styles.lockBadge}>🔒</span>}
    </button>
  )
}
```

- [ ] **Step 6: Add locked styles to ActionButton.module.css**

Open `src/components/ActionButton.module.css`. Add at the end:

```css
.locked {
  opacity: 0.35;
  cursor: not-allowed;
  filter: grayscale(0.8);
}

.lockBadge {
  margin-left: auto;
  font-size: 1.8rem;
}
```

- [ ] **Step 7: Implement lockedTypes prop in PotionPanel.jsx**

Open `src/components/PotionPanel.jsx`. Replace the entire file:

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

export default function PotionPanel({ potions, onUse, disabled, lockedTypes = [] }) {
  return (
    <div className={styles.panel}>
      {POTION_CONFIG.map(({ type, label, icon, color }) => {
        const count = potions[type]
        const isEmpty = count === 0
        const isLocked = lockedTypes.includes(type)
        return (
          <button
            key={type}
            className={`${styles.potion} ${isEmpty ? styles.empty : ''} ${isLocked ? styles.locked : ''}`}
            style={!isEmpty && !isLocked ? { borderColor: color } : {}}
            onClick={() => !isEmpty && !isLocked && onUse(type)}
            disabled={isEmpty || disabled || isLocked}
          >
            <span className={styles.potionIcon}>{icon}</span>
            <span className={styles.potionLabel}>{isLocked ? '🔒' : label}</span>
            {!isLocked && <span className={styles.potionCount}>{count}</span>}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 8: Add locked style to PotionPanel.module.css**

Open `src/components/PotionPanel.module.css`. Add at the end:

```css
.locked {
  opacity: 0.35;
  cursor: not-allowed;
  filter: grayscale(0.8);
}
```

- [ ] **Step 9: Wire locked logic in GamePage.jsx**

Open `src/components/GamePage.jsx`. Find the `ACTION_CONFIG.map(action => ...)` inside `.actionButtons`. Replace it with:

```jsx
{ACTION_CONFIG.map(action => {
  const isLocked = grade <= 2 && (action.type === 'magic' || action.type === 'aura')
  return (
    <ActionButton
      key={action.type}
      label={action.label}
      icon={action.icon}
      color={action.color}
      isActive={game.activeStatType === action.type && !game.activeIsPotion}
      onClick={() => handleActionButton(action)}
      disabled={game.phase !== 'setup'}
      locked={isLocked}
    />
  )
})}
```

Find the `<PotionPanel ... />` and add the `lockedTypes` prop:

```jsx
<PotionPanel
  potions={game.player.potions}
  onUse={handlePotionUse}
  disabled={game.phase !== 'setup'}
  lockedTypes={grade <= 2 ? ['magic', 'aura'] : []}
/>
```

- [ ] **Step 10: Run tests — confirm all pass**

```bash
npm test -- --run
```

Expected: 59 tests pass (53 existing + 4 ActionButton + 2 PotionPanel).

- [ ] **Step 11: Commit**

```bash
git add src/components/ActionButton.jsx src/components/ActionButton.module.css src/components/PotionPanel.jsx src/components/PotionPanel.module.css src/components/GamePage.jsx src/components/__tests__/ActionButton.test.jsx src/components/__tests__/PotionPanel.test.jsx
git commit -m "feat: grey out Magic and Aura for Apprentice and Warrior difficulty"
```

---

## Final Verification

- [ ] **Run full test suite**

```bash
npm test -- --run
```

Expected: 59 tests pass across 11 test files.
