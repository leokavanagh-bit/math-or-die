import { useState } from 'react'
import FrontPage  from './components/FrontPage'
import MapPage    from './components/MapPage'
import GamePage   from './components/GamePage'
import RewardPage from './components/RewardPage'
import { STAGES, initialPotions, rollPotionReward, mergePotions } from './campaign'

export default function App() {
  const [screen, setScreen]               = useState('front')
  const [grade, setGrade]                 = useState(1)
  const [campaignStage, setCampaignStage] = useState(0)
  const [potions, setPotions]             = useState(initialPotions)
  const [pendingReward, setPendingReward] = useState(null)
  const [fightKey, setFightKey]           = useState(0)

  function handleStart(selectedGrade) {
    setGrade(selectedGrade)
    setCampaignStage(0)
    setPotions(initialPotions())
    setPendingReward(null)
    setScreen('map')
  }

  function handleFight() {
    setFightKey(k => k + 1)
    setScreen('fight')
  }

  function handleVictory(leftoverPotions) {
    const reward = rollPotionReward(campaignStage)
    const merged = mergePotions(leftoverPotions, reward)
    setPotions(merged)
    setPendingReward(reward)
    setScreen('reward')
  }

  function handleRewardDone() {
    const next = campaignStage + 1
    if (next >= STAGES.length) {
      // Campaign complete — reset to front
      setCampaignStage(0)
      setPotions(initialPotions())
      setGrade(1)
      setScreen('front')
    } else {
      setCampaignStage(next)
      setScreen('map')
    }
  }

  function handleDefeat() {
    setCampaignStage(0)
    setPotions(initialPotions())
    setGrade(1)
    setScreen('front')
  }

  if (screen === 'front') {
    return <FrontPage onStart={handleStart} />
  }

  if (screen === 'map') {
    return <MapPage currentStage={campaignStage} onFight={handleFight} />
  }

  if (screen === 'reward') {
    const isBossVictory = campaignStage === STAGES.length - 1
    return (
      <RewardPage
        reward={pendingReward ?? {}}
        potions={potions}
        isBossVictory={isBossVictory}
        onContinue={handleRewardDone}
      />
    )
  }

  return (
    <GamePage
      key={fightKey}
      grade={grade}
      enemyHp={STAGES[campaignStage].enemyHp}
      fillRateMult={STAGES[campaignStage].fillRateMult}
      enemyProfilePic={STAGES[campaignStage].profilePic}
      startingPotions={potions}
      onVictory={handleVictory}
      onDefeat={handleDefeat}
    />
  )
}
