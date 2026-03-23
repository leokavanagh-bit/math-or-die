import { render, screen, fireEvent } from '@testing-library/react'
import MapPage from '../MapPage'

describe('MapPage', () => {
  it('renders How to Play button', () => {
    render(<MapPage currentStage={0} onFight={() => {}} />)
    expect(screen.getByRole('button', { name: /how to play/i })).toBeInTheDocument()
  })

  it('does not show HowToPlay modal initially', () => {
    render(<MapPage currentStage={0} onFight={() => {}} />)
    expect(screen.queryByText(/Survive all the rounds to win/i)).not.toBeInTheDocument()
  })

  it('shows HowToPlay modal when How to Play button is clicked', () => {
    render(<MapPage currentStage={0} onFight={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /how to play/i }))
    expect(screen.getByText(/Survive all the rounds to win/i)).toBeInTheDocument()
  })
})
