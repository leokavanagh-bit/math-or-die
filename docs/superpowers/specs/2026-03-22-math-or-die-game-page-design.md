# Math or Die — Game Page Design Spec
**Date:** 2026-03-22
**Scope:** Game Page (combat mechanics MVP) — React + Vite web app, iPad 10 optimised

---

## Overview

Math or Die is a math-based RPG combat game for 7-year-old Caelan, optimised for iPad 10 (portrait). The player fights enemies by solving math problems to stack combat stats within a 60-second setup phase, then watching the stats resolve into damage during the combat phase. The game is a web app (HTML/CSS/JavaScript via React + Vite) served in Safari.

This spec covers the Game Page MVP only. Front Page and progression mechanics are out of scope for this iteration.

---

## Platform

- **Target device:** iPad 10 (820×1180pt portrait, 2x Retina)
- **Tech stack:** React 18 + Vite, no additional game frameworks
- **Delivery:** Static web app, opened in Safari via local server or file hosting
- **Viewport:** `width=device-width, initial-scale=1`, full-screen, no scroll

The Paper design canvas is 1640×2359px — exactly 2x iPad 10 portrait resolution. No scaling required.

---

## Game State Machine

The game cycles through these phases each round:

```
FRONT_PAGE → SETUP_PHASE → COMBAT_PHASE → ROUND_END → (repeat or GAME_OVER)
```

- **SETUP_PHASE:** 60-second countdown. Player solves math problems to fill stat bars. Enemy fills stats autonomously via AI tick.
- **COMBAT_PHASE:** Timer hits 0. Stats are compared and HP adjusted. Animated resolution.
- **ROUND_END:** Stats reset to 0. HP changes persist. Brief summary shown before next round begins.
- **GAME_OVER:** One player reaches 0 HP. Win or lose screen displayed.

---

## File Structure

```
src/
  components/
    GamePage.jsx          ← root game screen, composes all components
    FrontPage.jsx         ← grade select + go button (stub for now)
    StatBar.jsx           ← reusable stat bar (15 slots), used for all 8 bars
    HealthBar.jsx         ← HP bar (20 segments), used for player + enemy
    NumPad.jsx            ← 0–9 + backspace + confirm button
    ActionButton.jsx      ← Attack / Shield / Magic / Aura buttons
    MathProblem.jsx       ← active question display + answer input area
    PotionPanel.jsx       ← 6 potion slots with counts
    Timer.jsx             ← 60s countdown display
  hooks/
    useGameState.js       ← all game state + phase transitions
    useEnemyAI.js         ← enemy stat-filling tick behaviour
    useMathEngine.js      ← problem generation by grade + operation type
  assets/                 ← SVG art exported from MATH_OR_DIE.ai
  App.jsx                 ← routes between FrontPage and GamePage
```

---

## Core Game State

Managed in `useGameState`:

```js
// Player
player: {
  health: 20,                          // max 20, persists across rounds
  attack: 0, shield: 0, magic: 0, aura: 0,  // 0–15, reset each round
  potions: { attack: 1, shield: 1, magic: 1, aura: 1, slow: 1, heal: 1 }  // one use per fight, not replenished between rounds
}

// Enemy
enemy: {
  health: 20,
  attack: 0, shield: 0, magic: 0, aura: 0,
  fillRate: 4000,      // ms between ticks, scales by round
  slowedUntil: null,   // timestamp while Slow potion active
  maxStats: 6          // total stat points enemy can accumulate, scales by round
}

// Shared
phase: 'setup' | 'combat' | 'roundEnd' | 'gameOver'
timeRemaining: 60      // seconds
grade: 1               // 1–4, defaults to 1 (hardcoded until FrontPage is implemented)
round: 1

// Active question
activeQuestion: { operation, a, b, answer } | null
activeStatType: 'attack' | 'shield' | 'magic' | 'aura' | null
activeIsPotion: false
userInput: ''
```

---

## Stat Bars

- **15 slots** per bar (matching Paper design)
- Fills left → right, one slot per correct answer
- Potion answers fill 3 slots at once
- Max 15 points per stat per round
- Player bars: red (Attack), blue (Shield), purple (Magic), gold (Aura)
- Enemy bars: same colours, mirrored layout

---

## Action Buttons

Four buttons stacked vertically on the left side of the screen (matching Paper design layers `BUTTON_ATTACK`, `BUTTON_SHIELD`, `BUTTON_MAGIC`, `BUTTON_AURA`):

| Button | Operation | Stat |
|--------|-----------|------|
| Attack ⚔ | Addition | player.attack +1 |
| Shield 🛡 | Subtraction | player.shield +1 |
| Magic ✨ | Multiplication | player.magic +1 |
| Aura 🌟 | Division | player.aura +1 |

- Tapping a button sets `activeStatType` and generates a new math problem
- The question appears in the panel to the right of the button
- Only one question is active at a time
- Switching buttons mid-answer cancels the current question (no penalty)

---

## Math Problem Engine (useMathEngine)

Problem difficulty by grade level:

| Grade | Addition | Subtraction | Multiplication | Division |
|-------|----------|-------------|----------------|----------|
| 1 | 1–10 + 1–10 | 1–10 − 1–5 (no negatives) | 1–5 × 1–5 | ÷2, ÷5 only |
| 2 | 1–20 + 1–20 | 1–20 − 1–10 | 1–10 × 1–5 | ÷2, ÷3, ÷5 |
| 3 | 2-digit + 2-digit | 2-digit − 2-digit | 1–10 × 1–10 | ÷2 through ÷10 |
| 4 | 3-digit + 2-digit | 3-digit − 2-digit | 2-digit × 1-digit | 2-digit ÷ 1-digit |

All division problems use whole-number answers (no remainders).

---

## Number Pad

- Large touch targets suitable for 7-year-old fingers
- Buttons: 0–9, backspace (⌫), confirm (✓)
- Input displayed in the active MathProblem panel
- Confirm button validates answer:
  - **Correct:** stat +1 (or +3 for potion), green flash, next question auto-generated for same stat
  - **Wrong:** red shake animation, input clears, same question stays
  - No health/stat penalty for wrong answers — only time is lost

---

## Potion Panel

Six potions (`POT_ATTACK`, `POT_SHIELD`, `POT_MAGIC`, `POT_AURA`, `POT_SLOW`, `POT_HEAL`), 1 of each per round:

| Potion | Triggers | Effect on Correct Answer |
|--------|----------|--------------------------|
| Attack | Addition | player.attack +3 |
| Shield | Subtraction | player.shield +3 |
| Magic | Multiplication | player.magic +3 |
| Aura | Division | player.aura +3 |
| Slow | Any (simple) | enemy tick interval ×2 for 15 seconds |
| Heal | Any (simple) | player.health +5 (capped at 20) |

- Potions are consumed on correct answer
- Greyed out and permanently unavailable once used (one use per fight, not per round)
- Only usable during Setup phase

---

## Timer

- Counts down from 60s during Setup phase
- Displayed in the `TIMER` layer between the two stat panels
- Pulses red animation when ≤ 10 seconds remaining
- Hitting 0 triggers transition to Combat phase

---

## Enemy AI (useEnemyAI)

The enemy fills its stat bars autonomously during the Setup phase on a tick interval. The player can watch enemy bars fill in real-time and react (e.g. enemy adding Magic → player adds Aura to defend).

**Tick behaviour:** Each tick, the enemy picks a random stat (attack/shield/magic/aura) and increments it by 1. Total stat points are capped at `enemy.maxStats`. Per-stat maximum is 15 (same as the bar). In practice `maxStats` (6–13) prevents any single stat from reaching 15.

**Difficulty scaling by round:**

| Round | Tick interval | Max total stat points |
|-------|---------------|----------------------|
| 1 | 4s | 6 |
| 2 | 3s | 9 |
| 3 | 2.5s | 11 |
| 4+ | 2s | 13 |

**Slow potion effect:** Doubles tick interval for 15 seconds. A visual "slowed" indicator appears on the enemy side.

---

## Combat Resolution

Triggered when `timeRemaining` hits 0. Applied simultaneously:

```
enemyDamage = max(0, player.attack − enemy.shield) + max(0, player.magic − enemy.aura)
playerDamage = max(0, enemy.attack − player.shield) + max(0, enemy.magic − player.aura)

enemy.health -= enemyDamage
player.health -= playerDamage
```

- Shield does NOT block Magic. Aura does NOT block Attack.
- Damage is animated (health bars drain visually)
- After resolution, all stat points reset to 0. Potions are NOT replenished between rounds — each potion is one use per fight. Once consumed it is gone for the remainder of the fight.
- If either player reaches 0 HP → Game Over
- Otherwise → Round End → brief summary screen (shows damage dealt/received, ~2 seconds) → next round begins

---

## Health Bars

- 20 segments per bar (matching Paper design layers `PLAYER_HEALTH`, `ENEMY_HEALTH`)
- HP changes persist across rounds
- HP is NOT reset between rounds
- Starting HP: 20 for both player and enemy

---

## Out of Scope (this iteration)

- Front Page (grade picker UI) — stubbed with hardcoded grade
- Progression map
- Weapon upgrades / health upgrades
- Sound effects / music
- Save/load game state
- Multiple enemy types
