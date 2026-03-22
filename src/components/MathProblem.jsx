import styles from './MathProblem.module.css'

const OP_SYMBOLS = { addition: '+', subtraction: '−', multiplication: '×', division: '÷' }

export default function MathProblem({ question, userInput, isShaking, isCorrect }) {
  if (!question) {
    return <div className={styles.empty}>Select a button to begin</div>
  }

  const { operation, a, b } = question
  const symbol = OP_SYMBOLS[operation]

  return (
    <div className={`${styles.problem} ${isShaking ? styles.shake : ''} ${isCorrect ? styles.correct : ''}`}>
      <div className={styles.equation}>
        <span className={styles.number}>{a}</span>
        <span className={styles.operator}>{symbol}</span>
        <span className={styles.number}>{b}</span>
        <span className={styles.equals}>=</span>
        <span className={styles.answer}>{userInput || '?'}</span>
      </div>
    </div>
  )
}
