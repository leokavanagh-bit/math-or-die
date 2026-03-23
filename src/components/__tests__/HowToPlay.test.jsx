import { render, screen, fireEvent } from '@testing-library/react'
import HowToPlay from '../HowToPlay'

describe('HowToPlay', () => {
  it('renders game loop description', () => {
    render(<HowToPlay onClose={() => {}} />)
    expect(screen.getByText(/Survive all the rounds to win/i)).toBeInTheDocument()
  })

  it('renders all four action button descriptions', () => {
    render(<HowToPlay onClose={() => {}} />)
    expect(screen.getByText('Attack')).toBeInTheDocument()
    expect(screen.getByText('Shield')).toBeInTheDocument()
    expect(screen.getByText('Magic')).toBeInTheDocument()
    expect(screen.getByText('Aura')).toBeInTheDocument()
  })

  it('renders all six potion descriptions', () => {
    render(<HowToPlay onClose={() => {}} />)
    expect(screen.getByText('Attack Potion')).toBeInTheDocument()
    expect(screen.getByText('Heal Potion')).toBeInTheDocument()
    expect(screen.getByText('Slow Potion')).toBeInTheDocument()
  })

  it('calls onClose when Got it button is clicked', () => {
    const onClose = vi.fn()
    render(<HowToPlay onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /Got it/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
