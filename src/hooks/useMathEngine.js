function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const GRADE_CONFIG = {
  addition: {
    1: () => { const a = randInt(1,10), b = randInt(1,10); return { a, b, answer: a+b } },
    2: () => { const a = randInt(1,20), b = randInt(1,20); return { a, b, answer: a+b } },
    3: () => { const a = randInt(10,99), b = randInt(10,99); return { a, b, answer: a+b } },
    4: () => { const a = randInt(100,999), b = randInt(10,99); return { a, b, answer: a+b } },
  },
  subtraction: {
    1: () => { const b = randInt(1,5), a = randInt(b,10); return { a, b, answer: a-b } },
    2: () => { const b = randInt(1,10), a = randInt(b,20); return { a, b, answer: a-b } },
    3: () => { const b = randInt(10,99), a = randInt(b,99); return { a, b, answer: a-b } },
    4: () => { const b = randInt(10,99), a = randInt(b,999); return { a, b, answer: a-b } },
  },
  multiplication: {
    1: () => { const a = randInt(1,5), b = randInt(1,5); return { a, b, answer: a*b } },
    2: () => { const a = randInt(1,10), b = randInt(1,5); return { a, b, answer: a*b } },
    3: () => { const a = randInt(1,10), b = randInt(1,10); return { a, b, answer: a*b } },
    4: () => { const a = randInt(10,19), b = randInt(2,9); return { a, b, answer: a*b } },
  },
  division: {
    1: () => { const b = [2,5][randInt(0,1)], a = b * randInt(1,10); return { a, b, answer: a/b } },
    2: () => { const b = [2,3,5][randInt(0,2)], a = b * randInt(1,10); return { a, b, answer: a/b } },
    3: () => { const b = randInt(2,10), a = b * randInt(1,10); return { a, b, answer: a/b } },
    4: () => { const b = randInt(2,9), a = b * randInt(10,19); return { a, b, answer: a/b } },
  },
}

export function generateProblem(operation, grade) {
  const gen = GRADE_CONFIG[operation][grade]
  const { a, b, answer } = gen()
  return { operation, a, b, answer }
}

export default function useMathEngine(grade) {
  return {
    generate: (operation) => generateProblem(operation, grade),
  }
}
