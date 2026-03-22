import { generateProblem } from '../useMathEngine'

describe('generateProblem', () => {
  describe('grade 1 addition', () => {
    it('produces operands in 1–10 range', () => {
      for (let i = 0; i < 50; i++) {
        const p = generateProblem('addition', 1)
        expect(p.a).toBeGreaterThanOrEqual(1)
        expect(p.a).toBeLessThanOrEqual(10)
        expect(p.b).toBeGreaterThanOrEqual(1)
        expect(p.b).toBeLessThanOrEqual(10)
      }
    })
    it('answer equals a + b', () => {
      const p = generateProblem('addition', 1)
      expect(p.answer).toBe(p.a + p.b)
    })
  })

  describe('grade 1 subtraction', () => {
    it('never produces negative answers', () => {
      for (let i = 0; i < 50; i++) {
        const p = generateProblem('subtraction', 1)
        expect(p.answer).toBeGreaterThanOrEqual(0)
      }
    })
  })

  describe('grade 1 multiplication', () => {
    it('operands in 1–5 range', () => {
      for (let i = 0; i < 50; i++) {
        const p = generateProblem('multiplication', 1)
        expect(p.a).toBeGreaterThanOrEqual(1)
        expect(p.a).toBeLessThanOrEqual(5)
        expect(p.b).toBeGreaterThanOrEqual(1)
        expect(p.b).toBeLessThanOrEqual(5)
      }
    })
    it('answer equals a * b', () => {
      const p = generateProblem('multiplication', 1)
      expect(p.answer).toBe(p.a * p.b)
    })
  })

  describe('grade 1 division', () => {
    it('divisor is 2 or 5 only', () => {
      for (let i = 0; i < 50; i++) {
        const p = generateProblem('division', 1)
        expect([2, 5]).toContain(p.b)
      }
    })
    it('answer is always a whole number', () => {
      for (let i = 0; i < 50; i++) {
        const p = generateProblem('division', 1)
        expect(p.answer % 1).toBe(0)
      }
    })
  })

  describe('problem shape', () => {
    it('returns operation, a, b, answer', () => {
      const p = generateProblem('addition', 1)
      expect(p).toHaveProperty('operation')
      expect(p).toHaveProperty('a')
      expect(p).toHaveProperty('b')
      expect(p).toHaveProperty('answer')
    })
  })
})
