import { render, screen } from '@testing-library/react'
import StatBar from '../StatBar'

describe('StatBar', () => {
  it('renders 15 slots', () => {
    const { container } = render(<StatBar value={0} color="red" />)
    expect(container.querySelectorAll('.slot')).toHaveLength(15)
  })

  it('fills the correct number of slots', () => {
    const { container } = render(<StatBar value={5} color="red" />)
    const filled = container.querySelectorAll('.slot.filled')
    expect(filled).toHaveLength(5)
  })

  it('does not exceed 15 filled slots', () => {
    const { container } = render(<StatBar value={20} color="red" />)
    const filled = container.querySelectorAll('.slot.filled')
    expect(filled).toHaveLength(15)
  })
})
