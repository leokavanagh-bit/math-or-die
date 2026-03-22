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

  it('combat resolution reduces enemy health by attack - shield', async () => {
    const { result } = renderHook(() => useGameState(1))
    // Set player attack=5, enemy shield=2, all other stats=0
    await act(async () => {
      for (let i = 0; i < 5; i++) result.current.incrementPlayerStat('attack', 1)
      result.current.setEnemyStats({ attack: 0, shield: 2, magic: 0, aura: 0 })
      result.current.resolveCombat()
      await new Promise(r => setTimeout(r, 10))
    })
    expect(result.current.enemy.health).toBe(17) // 20 - (5-2)=3
  })

  it('combat damage cannot go below 0 (attack <= shield)', async () => {
    const { result } = renderHook(() => useGameState(1))
    await act(async () => {
      for (let i = 0; i < 3; i++) result.current.incrementPlayerStat('attack', 1)
      result.current.setEnemyStats({ attack: 0, shield: 5, magic: 0, aura: 0 })
      result.current.resolveCombat()
      await new Promise(r => setTimeout(r, 10))
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

  it('applySlowPotion sets enemy slowedUntil to ~15s from now', () => {
    const { result } = renderHook(() => useGameState(1))
    const before = Date.now()
    act(() => result.current.applySlowPotion())
    expect(result.current.enemy.slowedUntil).toBeGreaterThanOrEqual(before + 14000)
    expect(result.current.enemy.slowedUntil).toBeLessThanOrEqual(before + 16000)
  })

  it('applyHealPotion adds 5 HP when not at full health', async () => {
    const { result } = renderHook(() => useGameState(1))
    // Manually set health to 10 by resolving combat that deals 10 damage
    await act(async () => {
      result.current.setEnemyStats({ attack: 10, shield: 0, magic: 0, aura: 0 })
      result.current.resolveCombat()
      await new Promise(r => setTimeout(r, 10))
    })
    const healthBefore = result.current.player.health
    act(() => result.current.applyHealPotion())
    expect(result.current.player.health).toBe(Math.min(20, healthBefore + 5))
  })

  it('startNextRound increments round and updates enemy difficulty', () => {
    const { result } = renderHook(() => useGameState(1))
    expect(result.current.enemy.fillRate).toBe(4000)
    act(() => result.current.startNextRound())
    expect(result.current.round).toBe(2)
    expect(result.current.enemy.fillRate).toBe(3000)
    expect(result.current.enemy.maxStats).toBe(9)
  })

  it('resolveCombat sets phase to roundEnd when both survive', async () => {
    const { result } = renderHook(() => useGameState(1))
    await act(async () => {
      result.current.incrementPlayerStat('attack', 1)
      result.current.resolveCombat()
      await new Promise(r => setTimeout(r, 10))
    })
    expect(result.current.phase).toBe('roundEnd')
  })
})
