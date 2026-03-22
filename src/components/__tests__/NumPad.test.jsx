import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NumPad from '../NumPad'

describe('NumPad', () => {
  it('calls onDigit with the pressed number', async () => {
    const onDigit = vi.fn()
    render(<NumPad onDigit={onDigit} onBackspace={() => {}} onConfirm={() => {}} />)
    await userEvent.click(screen.getByText('5'))
    expect(onDigit).toHaveBeenCalledWith('5')
  })

  it('calls onBackspace when backspace is pressed', async () => {
    const onBackspace = vi.fn()
    render(<NumPad onDigit={() => {}} onBackspace={onBackspace} onConfirm={() => {}} />)
    await userEvent.click(screen.getByText('⌫'))
    expect(onBackspace).toHaveBeenCalled()
  })

  it('calls onConfirm when confirm is pressed', async () => {
    const onConfirm = vi.fn()
    render(<NumPad onDigit={() => {}} onBackspace={() => {}} onConfirm={onConfirm} />)
    await userEvent.click(screen.getByText('✓'))
    expect(onConfirm).toHaveBeenCalled()
  })
})
