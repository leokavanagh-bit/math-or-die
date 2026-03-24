export const STAGES = [
  { id: 0, enemyHp: 20, label: 'Slime',  boss: false, fillRateMult: 1.8,  profilePic: '/ENEMY_SLIME.svg'  },
  { id: 1, enemyHp: 25, label: 'Goblin', boss: false, fillRateMult: 1.4,  profilePic: '/ENEMY_GOBLIN.svg' },
  { id: 2, enemyHp: 30, label: 'Orc',    boss: false, fillRateMult: 1.1,  profilePic: '/ENEMY_ORC.svg'    },
  { id: 3, enemyHp: 35, label: 'Troll',  boss: false, fillRateMult: 0.9,  profilePic: '/ENEMY_TROLL.svg'  },
  { id: 4, enemyHp: 40, label: 'Knight', boss: false, fillRateMult: 0.75, profilePic: '/ENEMY_KNIGHT.svg' },
  { id: 5, enemyHp: 60, label: 'BOSS',   boss: true,  fillRateMult: 0.65, profilePic: '/ENEMY_BOSS.svg'   },
]

export const POTION_TYPES = ['attack', 'shield', 'magic', 'aura', 'slow', 'heal']

export const POTION_ICONS = {
  attack: '⚔️', shield: '🛡️', magic: '✨', aura: '🌟', slow: '🐢', heal: '💚',
}

export function initialPotions() {
  return { attack: 1, shield: 1, magic: 1, aura: 1, slow: 1, heal: 1 }
}

export function rollPotionReward(stageId) {
  if (stageId >= STAGES.length - 1) return {} // no reward after beating the boss
  const count = Math.random() < 0.5 ? 2 : 3
  const reward = {}
  for (let i = 0; i < count; i++) {
    const type = POTION_TYPES[Math.floor(Math.random() * POTION_TYPES.length)]
    reward[type] = (reward[type] ?? 0) + 1
  }
  return reward
}

export function mergePotions(existing, reward) {
  const merged = { ...existing }
  for (const [type, count] of Object.entries(reward)) {
    merged[type] = (merged[type] ?? 0) + count
  }
  return merged
}
