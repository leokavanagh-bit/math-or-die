import { useState } from 'react'
import FrontPage from './components/FrontPage'
import GamePage from './components/GamePage'

export default function App() {
  const [started, setStarted] = useState(false)

  if (!started) return <FrontPage onStart={() => setStarted(true)} />
  return <GamePage grade={1} />
}
