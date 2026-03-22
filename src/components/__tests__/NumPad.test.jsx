import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NumPad from '../NumPad'

describe('NumPad', () => {
  it('calls onDigit with the pressed number', async () => {
    const onDigit = vi.fn()
    render(<NumPad onDigit={onDigit} onBackspace={() => {}} />)
    await userEvent.click(screen.getByText('5'))
    expect(onDigit).toHaveBeenCalledWith('5')
  })

  it('calls onBackspace when backspace is pressed', async () => {
    const onBackspace = vi.fn()
    render(<NumPad onDigit={() => {}} onBackspace={onBackspace} />)
    await userEvent.click(screen.getByText('⌫'))
    expect(onBackspace).toHaveBeenCalled()
  })
})
