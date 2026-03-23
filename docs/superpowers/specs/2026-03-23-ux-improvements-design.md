# UX Improvements — Playtesting Feedback Design

**Goal:** Address six usability issues discovered during kid playtesting: layout inefficiency on iPad, missing keyboard input, difficulty too aggressive early on, grade labels causing embarrassment, no onboarding, and no speed ramping across campaign stages.

**Architecture:** Six independent, focused changes across `FrontPage`, `GamePage`, `campaign.js`, `useGameState`, and a new `HowToPlay` component. No new screens; no changes to campaign state machine or combat logic.

**Tech Stack:** React 18 + Vite, CSS Modules, existing scale-transform canvas approach (1640×2360px)

---

## 1. iPad Layout — Left/Right Split

Redesign `GamePage.jsx` and `GamePage.module.css` from a single-column flow into two areas.

**Full-width top strip** (flex row, `align-items: center`):
- Player profile pic (140px) + health bar inline on the left
- Stat bars for player (left-aligned, flex: 1)
- Timer (circular, centred)
- Stat bars for enemy (right-aligned, flex: 1)
- Enemy profile pic (140px) + health bar inline on the right

**Two-column main area** (flex row, filling remaining height):
- Left column (`width: 640px`, `flex-shrink: 0`): four action buttons stacked vertically (icon + label, tappable). When an action button is **active** — meaning `game.activeStatType === action.type && !game.activeIsPotion` — the `<MathProblem>` display appears directly below that button. The potion panel sits at the bottom of this column.
- Gap: `16px`
- Right column (`flex: 1`): numpad fills the full height. Numpad keys are larger because they have more vertical room.

**Canvas padding:** The `.page` div currently has `padding: 16px`. Keep padding on the top strip only (`padding-top: 16px; padding-left: 16px; padding-right: 16px; padding-bottom: 0`). The two-column main area runs edge-to-edge horizontally (the columns themselves provide their own internal padding as needed). This means the effective horizontal space for the two-column area is the full 1640px, and `640 + 16 + flex:1` fills it exactly.

**Potion math problem:** Potions set `game.activeIsPotion = true`. When active, the `<MathProblem>` display appears at the bottom of the left column above the potion panel (replacing the current `position:fixed` overlay). It uses the same `game.activeQuestion` state as action questions — no separate question path.

**What does NOT change:** 1640×2360 canvas + `Math.min` scale transform. Component APIs (`ActionButton`, `NumPad`, `PotionPanel`, `MathProblem`, `HealthBar`, `StatBar`) are unchanged.

---

## 2. Keyboard Number Input

Add a `keydown` event listener in `GamePage` via `useEffect`:
- Digits `0`–`9` → call `handleDigit(key)`
- `Backspace` → call `handleBackspace()`
- Guard: only fire when `game.activeQuestion !== null && game.phase === 'setup'`. The phase string `'setup'` is the exact value used in `useGameState` (initialised as `useState('setup')` and active throughout the round until `resolveCombat` or `startNextRound`). Both action and potion questions are answered during `'setup'` phase — both set `game.activeQuestion`, so the single guard covers both.
- Clean up listener on unmount

No UI changes.

---

## 3 & 6. Speed Ramping Across Campaign Stages

### `campaign.js`

Add `fillRateMult` to each stage:

| Stage | Enemy  | fillRateMult | Effective tick at round 1 (base 3000ms) |
|-------|--------|--------------|------------------------------------------|
| 0     | Slime  | 1.8          | ~5400ms (very slow)                      |
| 1     | Goblin | 1.4          | ~4200ms                                  |
| 2     | Orc    | 1.1          | ~3300ms                                  |
| 3     | Troll  | 0.9          | ~2700ms                                  |
| 4     | Knight | 0.75         | ~2250ms                                  |
| 5     | Boss   | 0.65         | ~1950ms                                  |

### `useGameState.js`

Add `fillRateMult` to the options object (default `1.0`):

```js
export default function useGameState(grade, { enemyHp = 20, startingPotions = null, fillRateMult = 1.0 } = {})
```

Store the value in a ref so `startNextRound` can access it without stale closure issues:

```js
const fillRateMultRef = useRef(fillRateMult)
```

`GamePage` is always fully unmounted between campaign stages (via `key={fightKey}` in `App.jsx`), so `fillRateMultRef` is never stale — the hook reinitialises from scratch on each fight. No `useEffect` sync is needed.

**`initialEnemy` call sites:** `initialEnemy` is called in exactly one place — the `useState` initialiser in `useGameState`. Update its signature to `initialEnemy(round, hp, mult)` and update that one call site to pass `fillRateMult`:

```js
const [enemy, _setEnemy] = useState(() => {
  const e = initialEnemy(1, enemyHp, fillRateMult)
  enemyRef.current = e
  return e
})
```

Update `initialEnemy(round, hp, mult)`:
```js
fillRate: diff.fillRate * mult
```

Update `startNextRound` to apply the same multiplier (non-compounding — each round gets `ENEMY_DIFFICULTY[round].fillRate * fillRateMultRef.current`):

```js
const diff = ENEMY_DIFFICULTY[Math.min(nextRound, 4)]
setEnemy(e => ({ ...e, fillRate: diff.fillRate * fillRateMultRef.current, maxStats: diff.maxStats }))
```

### `GamePage.jsx`

Accept `fillRateMult` prop (default `1.0`) and forward to `useGameState`:

```js
export default function GamePage({ grade = 1, enemyHp = 20, startingPotions = null, fillRateMult = 1.0, onVictory, onDefeat })
```

### `App.jsx`

Pass `fillRateMult` from the current stage:

```jsx
<GamePage
  key={fightKey}
  grade={grade}
  enemyHp={STAGES[campaignStage].enemyHp}
  fillRateMult={STAGES[campaignStage].fillRateMult}
  startingPotions={potions}
  onVictory={handleVictory}
  onDefeat={handleDefeat}
/>
```

---

## 4. Difficulty Names

### `FrontPage.jsx`

Rename `GRADES` array entries. The `grade` value passed to game logic is unchanged.

```js
const DIFFICULTIES = [
  { grade: 1, label: 'Apprentice', ops: 'Addition',              icon: '🌱' },
  { grade: 2, label: 'Warrior',    ops: 'Addition & Subtraction', icon: '⚔️' },
  { grade: 3, label: 'Mage',       ops: 'Multiplication',         icon: '✨' },
  { grade: 4, label: 'Archmage',   ops: 'All Operations',         icon: '🌟' },
]
```

Change subtitle from `"Choose your grade"` to `"Choose your difficulty"`.

---

## 5. How to Play Modal

### `src/components/HowToPlay.jsx` (new)

Full-screen dark overlay, scrollable. Closed by a "Got it!" button.

**Exact content:**

**The Game** (intro paragraph):
> "Pick an action, solve a maths problem, and build your stats before time runs out. When the timer hits zero, combat resolves — your attack hits the enemy, their attack hits you. Survive all the rounds to win!"

**Action Buttons** (4 rows):

| Icon | Name   | Math     | In combat |
|------|--------|----------|-----------|
| ⚔   | Attack | Addition | Each point of attack deals 1 damage to the enemy (reduced by their Shield) |
| 🛡   | Shield | Subtraction | Each point of shield absorbs 1 damage from the enemy's Attack |
| ✨   | Magic  | Multiplication | Each point of magic deals 1 bonus damage (reduced by their Aura) |
| 🌟   | Aura   | Division | Each point of aura absorbs 1 damage from the enemy's Magic |

**Potions** (6 rows):

| Icon | Name         | Effect |
|------|--------------|--------|
| ⚔️   | Attack Potion | +3 Attack this round |
| 🛡️   | Shield Potion | +3 Shield this round |
| ✨   | Magic Potion  | +3 Magic this round |
| 🌟   | Aura Potion   | +3 Aura this round |
| 🐢   | Slow Potion   | Slows the enemy for 15 seconds |
| 💚   | Heal Potion   | Restore 5 HP (max 20) |

**Close button:** "Got it! ✓"

### `src/components/HowToPlay.module.css` (new)

Dark full-screen overlay (`position: fixed`, `inset: 0`, `background: rgba(0,0,0,0.92)`, `z-index: 100`). Scrollable content panel centred with `max-width: 600px`.

**Positioning note:** `HowToPlay` is only used inside `FrontPage` and `MapPage` — neither of which uses the CSS `transform` canvas. `FrontPage` is a plain full-viewport flex layout; `MapPage` uses `position: relative` with `width/height: 100vw/100vh` but no CSS transform on the root. `position: fixed` will work correctly in both cases.

### `FrontPage.jsx`

Add `const [showHelp, setShowHelp] = useState(false)`. Add "How to Play" button (secondary style, top-right area of page or below the grade buttons). Render `{showHelp && <HowToPlay onClose={() => setShowHelp(false)} />}`.

### `MapPage.jsx`

Same `showHelp` state. Place "How to Play" button in the existing `.header` section (top-right, alongside the title). Render `{showHelp && <HowToPlay onClose={() => setShowHelp(false)} />}`.

---

## Files Touched

| File | Change |
|------|--------|
| `src/campaign.js` | Add `fillRateMult` to each STAGE entry |
| `src/hooks/useGameState.js` | Accept `fillRateMult`; store in ref; apply in `initialEnemy` and `startNextRound` |
| `src/components/GamePage.jsx` | Accept `fillRateMult` prop; redesign layout to left/right split; add keyboard listener |
| `src/components/GamePage.module.css` | Rewrite layout styles for left/right split |
| `src/components/FrontPage.jsx` | Rename difficulty labels; add How to Play button |
| `src/components/MapPage.jsx` | Add How to Play button in header (top-right) |
| `src/App.jsx` | Pass `fillRateMult` from current stage to GamePage |
| `src/components/HowToPlay.jsx` | New modal component with exact copy |
| `src/components/HowToPlay.module.css` | New modal styles |

## Testing Notes

- `useGameState` tests: `fillRateMult` defaults to `1.0` so all existing tests pass without changes. The new `startNextRound` test for `enemy.fillRate` should be updated to reflect the multiplied value if a non-default mult is used.
- `GamePage` layout tests: the layout rewrite in section 1 will break any snapshot tests of `GamePage`. Update snapshots after implementation.
- No other test changes are expected.

## Out of Scope

- No changes to combat resolution math
- No changes to campaign stage count or enemy HP values
- No changes to potion reward system
- No changes to audio
