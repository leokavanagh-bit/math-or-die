import { useEffect, useState } from 'react'
import styles from './RewardPage.module.css'
import { POTION_TYPES, POTION_ICONS } from '../campaign'

const DESIGN_WIDTH  = 1640
const DESIGN_HEIGHT = 2360

export default function RewardPage({ reward, potions, isBossVictory, onContinue }) {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const update = () =>
      setScale(Math.min(window.innerWidth / DESIGN_WIDTH, window.innerHeight / DESIGN_HEIGHT))
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  const earnedTypes = POTION_TYPES.filter(t => reward[t])

  return (
    <div
      className={styles.page}
      style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: DESIGN_WIDTH, height: DESIGN_HEIGHT }}
    >
      {isBossVictory ? (
        <>
          <div className={styles.trophy}>🏆</div>
          <h1 className={styles.titleGold}>CAMPAIGN COMPLETE!</h1>
          <p className={styles.sub}>You defeated all enemies and the final boss!</p>
        </>
      ) : (
        <>
          <div className={styles.trophy}>⚔️</div>
          <h1 className={styles.title}>ENEMY DEFEATED!</h1>
        </>
      )}

      {earnedTypes.length > 0 && (
        <div className={styles.rewardBox}>
          <p className={styles.rewardLabel}>Potions earned:</p>
          <div className={styles.rewardRow}>
            {earnedTypes.map(t => (
              <div key={t} className={styles.rewardItem}>
                <span className={styles.rewardIcon}>{POTION_ICONS[t]}</span>
                <span className={styles.rewardCount}>+{reward[t]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.bagBox}>
        <p className={styles.rewardLabel}>Your potion bag:</p>
        <div className={styles.bagGrid}>
          {POTION_TYPES.map(t => (
            <div key={t} className={styles.bagItem}>
              <span className={styles.bagIcon}>{POTION_ICONS[t]}</span>
              <span className={styles.bagCount}>{potions[t] ?? 0}</span>
            </div>
          ))}
        </div>
      </div>

      <button className={styles.continueBtn} onClick={onContinue}>
        {isBossVictory ? 'Play Again' : 'Back to Map →'}
      </button>
    </div>
  )
}
