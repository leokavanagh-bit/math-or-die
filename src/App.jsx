import { useState } from 'react'
import FrontPage from './components/FrontPage'
import GamePage from './components/GamePage'

export default function App() {
  const [started, setStarted] = useState(false)
  const [gameKey, setGameKey] = useState(0)

  if (!started) return <FrontPage onStart={() => setStarted(true)} />
  return <GamePage key={gameKey} grade={1} onRestart={() => setGameKey(k => k + 1)} />
}
