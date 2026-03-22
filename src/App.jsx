import { useState } from 'react'
import FrontPage from './components/FrontPage'
import GamePage from './components/GamePage'

export default function App() {
  const [grade, setGrade] = useState(null)
  const [gameKey, setGameKey] = useState(0)

  function handleStart(selectedGrade) {
    setGrade(selectedGrade)
    setGameKey(k => k + 1)
  }

  function handleRestart() {
    setGrade(null)
  }

  if (grade === null) return <FrontPage onStart={handleStart} />
  return <GamePage key={gameKey} grade={grade} onRestart={handleRestart} />
}
