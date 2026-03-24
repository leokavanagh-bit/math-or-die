import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ActionButton from '../ActionButton'

describe('ActionButton', () => {
  it('renders label and icon', () => {
    render(<ActionButton label="Attack" icon="⚔" color="#e74c3c" onClick={() => {}} />)
    expect(screen.getByText('Attack')).toBeInTheDocument()
    expect(screen.getByText('⚔')).toBeInTheDocument()
  })

  it('calls onClick when clicked and not locked', async () => {
    const onClick = vi.fn()
    render(<ActionButton label="Attack" icon="⚔" color="#e74c3c" onClick={onClick} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled and shows lock badge when locked=true', () => {
    render(<ActionButton label="Magic" icon="✨" color="#9b59b6" locked={true} onClick={() => {}} />)
    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByText('🔒')).toBeInTheDocument()
  })

  it('does not call onClick when locked', async () => {
    const onClick = vi.fn()
    render(<ActionButton label="Magic" icon="✨" color="#9b59b6" locked={true} onClick={onClick} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })
})
