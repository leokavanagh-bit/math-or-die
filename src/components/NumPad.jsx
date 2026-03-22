import styles from './NumPad.module.css'

const ROWS = [['7','8','9'], ['4','5','6'], ['1','2','3'], ['⌫','0','✓']]

export default function NumPad({ onDigit, onBackspace, onConfirm, disabled }) {
  function handlePress(key) {
    if (disabled) return
    if (key === '⌫') onBackspace()
    else if (key === '✓') onConfirm()
    else onDigit(key)
  }

  return (
    <div className={styles.numPad}>
      {ROWS.map((row, ri) => (
        <div key={ri} className={styles.row}>
          {row.map(key => (
            <button
              key={key}
              className={`${styles.key} ${key === '✓' ? styles.confirm : ''} ${key === '⌫' ? styles.backspace : ''}`}
              onPointerDown={() => handlePress(key)}
              disabled={disabled}
            >
              {key}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}
