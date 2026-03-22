import { useEffect } from 'react'
import styles from './Timer.module.css'

export default function Timer({ timeRemaining, phase, onTick, onExpire }) {
  useEffect(() => {
    if (phase !== 'setup') return
    if (timeRemaining <= 0) { onExpire(); return }

    const id = setInterval(() => onTick(), 1000)
    return () => clearInterval(id)
  }, [timeRemaining, phase, onTick, onExpire])

  const isUrgent = timeRemaining <= 10

  return (
    <div className={`${styles.timer} ${isUrgent ? styles.urgent : ''}`}>
      <div className={styles.display}>
        {String(timeRemaining).padStart(2, '0')}
      </div>
    </div>
  )
}
