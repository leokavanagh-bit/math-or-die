import { render, screen, fireEvent } from '@testing-library/react'
import FrontPage from '../FrontPage'

describe('FrontPage', () => {
  it('renders How to Play button', () => {
    render(<FrontPage onStart={() => {}} />)
    expect(screen.getByRole('button', { name: /how to play/i })).toBeInTheDocument()
  })

  it('does not show HowToPlay modal initially', () => {
    render(<FrontPage onStart={() => {}} />)
    expect(screen.queryByText(/Survive all the rounds to win/i)).not.toBeInTheDocument()
  })

  it('shows HowToPlay modal when How to Play button is clicked', () => {
    render(<FrontPage onStart={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /how to play/i }))
    expect(screen.getByText(/Survive all the rounds to win/i)).toBeInTheDocument()
  })
})
