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

  it('disables potion buttons for lockedTypes', () => {
    render(<PotionPanel potions={defaultPotions} onUse={() => {}} lockedTypes={['magic', 'aura']} />)
    const buttons = screen.getAllByRole('button')
    // POTION_CONFIG order: attack(0), shield(1), magic(2), aura(3), slow(4), heal(5)
    expect(buttons[2]).toBeDisabled()
    expect(buttons[3]).toBeDisabled()
    expect(buttons[0]).not.toBeDisabled()
  })

  it('does not call onUse for a locked potion type', async () => {
    const onUse = vi.fn()
    render(<PotionPanel potions={defaultPotions} onUse={onUse} lockedTypes={['magic']} />)
    const buttons = screen.getAllByRole('button')
    await userEvent.click(buttons[2]) // magic
    expect(onUse).not.toHaveBeenCalled()
  })
})
