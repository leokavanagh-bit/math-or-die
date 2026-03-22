import { render } from '@testing-library/react'
import HealthBar from '../HealthBar'

describe('HealthBar', () => {
  it('renders 20 segments', () => {
    const { container } = render(<HealthBar value={20} />)
    expect(container.querySelectorAll('.segment')).toHaveLength(20)
  })

  it('fills correct number of segments', () => {
    const { container } = render(<HealthBar value={12} />)
    expect(container.querySelectorAll('.segment.filled')).toHaveLength(12)
  })

  it('renders 0 filled segments when health is 0', () => {
    const { container } = render(<HealthBar value={0} />)
    expect(container.querySelectorAll('.segment.filled')).toHaveLength(0)
  })
})
