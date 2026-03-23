# Gameplay UX Round 2 — Design Spec

**Goal:** Four targeted improvements from playtesting: move the math problem above the numpad, add a tap-to-continue pause between rounds, give each enemy a distinct portrait, and restrict Magic/Aura to grades 3–4.

**Architecture:** Five isolated changes touching `GamePage`, `ActionButton`, `PotionPanel`, `campaign.js`, and `App`. No new screens; no changes to combat logic or `useGameState`.

**Tech Stack:** React 18 + Vite, CSS Modules, 1640×2360px canvas with `Math.min` scale transform.

---

## 1. Math Problem — Move to Right Column, Larger

### `GamePage.jsx`

Remove `{game.activeQuestion && <div className={styles.mathArea}>…</div>}` from `.leftCol`. Place it in `.rightCol`, **above** `<NumPad>`:

```jsx
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

The NumPad retains `flex: 1` so it fills remaining space when the math area is absent.

### `GamePage.module.css`

Update `.mathArea` for larger, more prominent display:

```css
.mathArea {
  flex-shrink: 0;
  padding: 0 16px 8px;
}
```

The `MathProblem` component renders its own styled container; the larger appearance comes from updating `MathProblem.module.css` (see below).

### `MathProblem.module.css`

Increase font sizes so the problem is clearly readable at the top of the right column. Exact values are at implementer's discretion, but the problem text should be noticeably larger than the current size.

---

## 2. Round Pause — Tap to Continue

### `GamePage.jsx`

**Remove the auto-advance setTimeout from `handleTimerExpire`:**

```js
const handleTimerExpire = useCallback(() => {
  game.resolveCombat()
}, [game])
```

**Add a `roundEnd` conditional render block** — place it immediately before the `if (game.phase === 'gameOver')` block:

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

`audio.startMusic()` and `game.startNextRound()` move here from the removed setTimeout. Note: `startMusic()` in `useAudio` calls `stopMusic()` first then restarts from beat 0 — it is intentionally non-idempotent. The unconditional call here matches the old behavior (music restarts fresh at each new round). No `musicStartedRef` guard is needed.

### `GamePage.module.css`

Add styles for the round interstitial (same full-canvas pattern as `.gameOver`):

```css
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

---

## 3. Enemy Profile Pictures

### New SVG files in `/public/`

Create these files with simple, distinct pixel-art-style SVG portraits:

| Filename | Enemy |
|----------|-------|
| `ENEMY_SLIME.svg` | Green blob with eyes |
| `ENEMY_GOBLIN.svg` | Green pointy-eared face |
| `ENEMY_ORC.svg` | Dark green heavy face |
| `ENEMY_TROLL.svg` | Grey rocky face |
| `ENEMY_KNIGHT.svg` | Silver helmet face |
| `ENEMY_BOSS.svg` | Dark purple crowned face |

Also replace `PROFILE_PIC_PLAYER.svg` with a new simple human portrait. `PROFILE_PIC_ENEMY.svg` is kept as fallback but no longer used in the main flow.

All files must be valid SVG with `viewBox="0 0 80 80"` and a transparent or dark `#111` background. Width/height attributes omitted (sized by CSS).

### `src/campaign.js`

Add `profilePic` to each STAGE entry:

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

### `src/App.jsx`

Pass `enemyProfilePic` to `GamePage`:

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

### `src/components/GamePage.jsx`

Add `enemyProfilePic = '/PROFILE_PIC_ENEMY.svg'` to the function signature:

```js
export default function GamePage({ grade = 1, enemyHp = 20, startingPotions = null, fillRateMult = 1.0, enemyProfilePic = '/PROFILE_PIC_ENEMY.svg', onVictory, onDefeat })
```

Replace both occurrences of `'/PROFILE_PIC_ENEMY.svg'` with `{enemyProfilePic}`:
- The `<img>` in `.combatantCompact` (right side of top strip)
- The `<img>` in the `gameOver` block defeat branch (`won ? '/PROFILE_PIC_PLAYER.svg' : '/PROFILE_PIC_ENEMY.svg'`)

The player image remains hardcoded as `'/PROFILE_PIC_PLAYER.svg'` throughout.

---

## 4. Locked Actions for Grades 1–2

### Definition

`locked` means: visually dimmed, not clickable, shows a 🔒 indicator. Applies to Magic and Aura action buttons AND Magic and Aura potions when `grade <= 2`.

### `src/components/ActionButton.jsx`

Add `locked` prop (default `false`). When locked: apply `.locked` CSS class and show 🔒 badge:

```jsx
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

### `src/components/ActionButton.module.css`

Add:

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

### `src/components/PotionPanel.jsx`

Add `lockedTypes` prop (string array, default `[]`). Apply locked style to matching potion slots:

```jsx
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

### `src/components/PotionPanel.module.css`

Add:

```css
.locked {
  opacity: 0.35;
  cursor: not-allowed;
  filter: grayscale(0.8);
}
```

### `src/components/GamePage.jsx`

Compute locked state inline and pass props:

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

Pass `lockedTypes` to `PotionPanel`:

```jsx
<PotionPanel
  potions={game.player.potions}
  onUse={handlePotionUse}
  disabled={game.phase !== 'setup'}
  lockedTypes={grade <= 2 ? ['magic', 'aura'] : []}
/>
```

---

## Files Touched

| File | Change |
|------|--------|
| `src/components/GamePage.jsx` | Move mathArea to rightCol; remove setTimeout; add roundEnd block; accept `enemyProfilePic`; use it in img tags; add locked logic for buttons+potions |
| `src/components/GamePage.module.css` | Update `.mathArea`; add `.roundEnd`, `.roundEndSub`, `.roundEndTitle`, `.roundEndPrompt`, `.readyBtn` |
| `src/components/MathProblem.module.css` | Increase font sizes for larger display |
| `src/components/ActionButton.jsx` | Add `locked` prop; render `.locked` class and `lockBadge` |
| `src/components/ActionButton.module.css` | Add `.locked` and `.lockBadge` styles |
| `src/components/PotionPanel.jsx` | Add `lockedTypes` prop; apply locked style per type |
| `src/components/PotionPanel.module.css` | Add `.locked` style |
| `src/campaign.js` | Add `profilePic` to each STAGE entry |
| `src/App.jsx` | Pass `enemyProfilePic={STAGES[campaignStage].profilePic}` to `GamePage` |
| `public/PROFILE_PIC_PLAYER.svg` | Replace with new simple player portrait |
| `public/ENEMY_SLIME.svg` | New enemy portrait |
| `public/ENEMY_GOBLIN.svg` | New enemy portrait |
| `public/ENEMY_ORC.svg` | New enemy portrait |
| `public/ENEMY_TROLL.svg` | New enemy portrait |
| `public/ENEMY_KNIGHT.svg` | New enemy portrait |
| `public/ENEMY_BOSS.svg` | New enemy portrait |

## Testing Notes

- `useGameState` tests: no changes needed — `startNextRound` behaviour is unchanged; the auto-advance was in `GamePage`, not the hook.
- `ActionButton` tests: if a snapshot test exists, update it. Add a test that `locked=true` renders `.locked` class and disables the button.
- `PotionPanel` tests: add a test that `lockedTypes=['magic']` disables and dims the magic potion slot.
- No snapshot tests exist for `GamePage` — full test suite should pass without changes.

## Out of Scope

- No changes to combat damage calculation
- No changes to campaign progression or potion rewards
- No changes to audio
- No changes to `useGameState` hook internals
