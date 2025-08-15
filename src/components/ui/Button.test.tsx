import { describe, it, expect } from 'vitest'
import { render, screen } from '../../test/utils'
import { Button } from './Button'

describe('Button', () => {
  it('renders with default variant', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByText('Click me')
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('btn')
  })

  it('renders with primary variant', () => {
    render(<Button variant="primary">Primary</Button>)
    const button = screen.getByText('Primary')
    expect(button).toHaveClass('btn-primary')
  })

  it('renders with secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>)
    const button = screen.getByText('Secondary')
    expect(button).toHaveClass('btn-secondary')
  })

  it('renders with outline variant', () => {
    render(<Button variant="outline">Outline</Button>)
    const button = screen.getByText('Outline')
    expect(button).toHaveClass('btn-outline')
  })

  it('renders with ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>)
    const button = screen.getByText('Ghost')
    expect(button).toHaveClass('btn-ghost')
  })

  it('renders with different sizes', () => {
    const { rerender } = render(<Button size="lg">Large</Button>)
    expect(screen.getByText('Large')).toHaveClass('btn-lg')

    rerender(<Button size="sm">Small</Button>)
    expect(screen.getByText('Small')).toHaveClass('btn-sm')
  })

  it('handles click events', () => {
    let clicked = false
    render(<Button onClick={() => clicked = true}>Click me</Button>)
    screen.getByText('Click me').click()
    expect(clicked).toBe(true)
  })

  it('can be disabled', () => {
    render(<Button disabled>Disabled</Button>)
    const button = screen.getByText('Disabled')
    expect(button).toBeDisabled()
  })

  it('renders with custom className', () => {
    render(<Button className="custom-class">Custom</Button>)
    const button = screen.getByText('Custom')
    expect(button).toHaveClass('custom-class')
  })
})
