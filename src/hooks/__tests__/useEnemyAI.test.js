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
