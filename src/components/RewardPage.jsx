import styles from './RewardPage.module.css'
import { POTION_TYPES, POTION_ICONS } from '../campaign'

export default function RewardPage({ reward, potions, isBossVictory, onContinue }) {
  const earnedTypes = POTION_TYPES.filter(t => reward[t])

  return (
    <div className={styles.page}>
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
