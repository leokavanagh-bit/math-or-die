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
  it('returns one of the four stat types for grade 3+', () => {
    const stats = ['attack', 'shield', 'magic', 'aura']
    for (let i = 0; i < 20; i++) {
      expect(stats).toContain(pickEnemyStat(3))
    }
  })

  it('returns only attack or shield for grades 1-2', () => {
    const basicStats = ['attack', 'shield']
    for (let i = 0; i < 20; i++) {
      expect(basicStats).toContain(pickEnemyStat(1))
      expect(basicStats).toContain(pickEnemyStat(2))
    }
  })
})
