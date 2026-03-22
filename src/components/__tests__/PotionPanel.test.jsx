import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PotionPanel from '../PotionPanel'

const defaultPotions = { attack: 1, shield: 1, magic: 1, aura: 1, slow: 1, heal: 1 }

describe('PotionPanel', () => {
  it('renders 6 potion buttons', () => {
    render(<PotionPanel potions={defaultPotions} onUse={() => {}} />)
    expect(screen.getAllByRole('button')).toHaveLength(6)
  })

  it('shows a potion as disabled when count is 0', () => {
    const potions = { ...defaultPotions, attack: 0 }
    render(<PotionPanel potions={potions} onUse={() => {}} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons[0]).toBeDisabled()
  })

  it('calls onUse with the potion type when clicked', async () => {
    const onUse = vi.fn()
    render(<PotionPanel potions={defaultPotions} onUse={onUse} />)
    await userEvent.click(screen.getAllByRole('button')[0])
    expect(onUse).toHaveBeenCalledWith('attack')
  })
})
