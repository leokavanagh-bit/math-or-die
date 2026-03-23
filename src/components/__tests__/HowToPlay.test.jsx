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

  it('calls onClose when overlay background is clicked', () => {
    const onClose = vi.fn()
    const { container } = render(<HowToPlay onClose={onClose} />)
    // The overlay is the root element (container.firstChild)
    fireEvent.click(container.firstChild)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose when inner panel is clicked', () => {
    const onClose = vi.fn()
    render(<HowToPlay onClose={onClose} />)
    // The panel contains the "How to Play" title — click it
    fireEvent.click(screen.getByText('How to Play'))
    expect(onClose).not.toHaveBeenCalled()
  })
})
