# UX Improvements — Playtesting Feedback Design

**Goal:** Address six usability issues discovered during kid playtesting: layout inefficiency on iPad, missing keyboard input, difficulty too aggressive early on, grade labels causing embarrassment, no onboarding, and no speed ramping across campaign stages.

**Architecture:** Six independent, focused changes across `FrontPage`, `GamePage`, `campaign.js`, `useGameState`, and a new `HowToPlay` component. No new screens; no changes to campaign state machine or combat logic.

**Tech Stack:** React 18 + Vite, CSS Modules, existing scale-transform canvas approach (1640×2360px)

---

## 1. iPad Layout — Left/Right Split

### What changes
`GamePage.jsx` and `GamePage.module.css` are redesigned from a single-column flow into a two-area layout:

**Full-width top strip:**
- Player profile pic (140px) + health bar inline on the left
- VS label in centre
- Enemy profile pic (140px) + health bar inline on the right
- Stat bars for both combatants flanking the timer (same as current statsRow, but more compact)

**Two-column main area:**
- Left column (~640px wide): four action buttons stacked vertically, each showing icon + label. When a button is active, the math problem display appears directly below it in the same column. Potions panel at the bottom of the column.
- Right column (~940px wide): circular timer at top, numpad filling the rest. Numpad keys are larger because they have more vertical room.

### What does NOT change
- The 1640×2360 canvas + `Math.min` scale transform approach stays identical
- `ActionButton`, `NumPad`, `PotionPanel`, `MathProblem`, `HealthBar`, `StatBar` component APIs are unchanged
- Potion math problem overlay (currently `position:fixed`) moves to inline within the left column

---

## 2. Keyboard Number Input

### What changes
Add a `keydown` event listener inside `GamePage` (via `useEffect`):
- Digits `0`–`9` → call `handleDigit(key)`
- `Backspace` → call `handleBackspace()`
- Guard: only active when `game.activeQuestion !== null && game.phase === 'setup'`

No UI changes. The listener is cleaned up on unmount.

---

## 3 & 6. Speed Ramping Across Campaign Stages

### What changes

**`campaign.js`** — add `fillRateMult` to each stage:

| Stage | Enemy  | fillRateMult | Effect vs current round-1 (3000ms) |
|-------|--------|--------------|--------------------------------------|
| 0     | Slime  | 1.8          | ~5400ms per stat tick (very slow)    |
| 1     | Goblin | 1.4          | ~4200ms                              |
| 2     | Orc    | 1.1          | ~3300ms                              |
| 3     | Troll  | 0.9          | ~2700ms                              |
| 4     | Knight | 0.75         | ~2250ms                              |
| 5     | Boss   | 0.65         | ~1950ms (faster than current)        |

**`useGameState.js`** — accept `fillRateMult` in the options object (default `1.0`). Apply it inside `initialEnemy` and `startNextRound`:

```js
useGameState(grade, { enemyHp = 20, startingPotions = null, fillRateMult = 1.0 } = {})
```

`initialEnemy(round, hp, fillRateMult)` → `fillRate: diff.fillRate * fillRateMult`

`startNextRound` re-applies the same `fillRateMult` when escalating to the next round's base rate.

**`App.jsx`** — pass `STAGES[campaignStage].fillRateMult` to `GamePage` as a new `fillRateMult` prop, which forwards it to `useGameState`.

**`GamePage.jsx`** — accept and forward `fillRateMult` prop (default `1.0`).

### What does NOT change
Per-round escalation logic inside `useGameState` is unchanged — the `fillRateMult` is a multiplier on top of the existing `ENEMY_DIFFICULTY` table.

---

## 4. Difficulty Names

### What changes
`FrontPage.jsx` — rename `GRADES` array entries. The `grade` value (1–4) passed to game logic is unchanged.

| grade | Old label | New label   | Icon |
|-------|-----------|-------------|------|
| 1     | Grade 1   | Apprentice  | 🌱   |
| 2     | Grade 2   | Warrior     | ⚔️   |
| 3     | Grade 3   | Mage        | ✨   |
| 4     | Grade 4   | Archmage    | 🌟   |

The subtitle on FrontPage changes from "Choose your grade" to "Choose your difficulty".

---

## 5. How to Play Modal

### What changes

**New file: `src/components/HowToPlay.jsx`**
A full-screen dark overlay modal. Triggered by a "How to Play" button on `FrontPage` and `MapPage`.

Content sections:
1. **The Game Loop** — 2–3 sentences: pick an action, solve a math problem, build your stats, timer runs out, combat resolves.
2. **Action Buttons** — four rows, one per action:
   - ⚔ **Attack** — Addition problems. Your attack minus the enemy's shield = damage dealt.
   - 🛡 **Shield** — Subtraction problems. Reduces damage you take from the enemy's attack.
   - ✨ **Magic** — Multiplication problems. Magic minus enemy's aura = extra damage.
   - 🌟 **Aura** — Division problems. Reduces damage from enemy's magic.
3. **Potions** — six rows, one per potion type with icon and one-line effect.
4. Close button ("Got it!") at the bottom.

**`HowToPlay.module.css`** — dark overlay, scrollable content panel, same dark theme as the rest of the game.

**`FrontPage.jsx`** — add `useState` for `showHelp`, render `<HowToPlay>` when true, add "How to Play" button.

**`MapPage.jsx`** — same: add `showHelp` state and "How to Play" button in the header.

### What does NOT change
No localStorage persistence — the button is always accessible so there's no need to remember whether the user has seen it.

---

## Files Touched

| File | Change |
|------|--------|
| `src/campaign.js` | Add `fillRateMult` to each STAGE entry |
| `src/hooks/useGameState.js` | Accept + apply `fillRateMult` option |
| `src/components/GamePage.jsx` | Accept `fillRateMult` prop; redesign layout to left/right split; add keyboard listener |
| `src/components/GamePage.module.css` | Rewrite layout styles for left/right split |
| `src/components/FrontPage.jsx` | Rename difficulty labels; add How to Play button |
| `src/components/MapPage.jsx` | Add How to Play button |
| `src/App.jsx` | Pass `fillRateMult` from current stage to GamePage |
| `src/components/HowToPlay.jsx` | New modal component |
| `src/components/HowToPlay.module.css` | New styles for modal |

## Out of Scope

- No changes to combat resolution math
- No changes to campaign stage count or enemy HP values
- No changes to potion reward system
- No changes to audio
- No changes to test files beyond what's needed to keep existing tests green
