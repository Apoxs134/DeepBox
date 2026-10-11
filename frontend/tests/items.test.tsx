import { describe, it, expect, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ItemList } from '../src/features/items/components/ItemList'
import { ItemForm } from '../src/features/items/components/ItemForm'
import type { Item } from '../src/features/items/types'

describe('Items Feature Slice', () => {
  const sampleItems: Item[] = [
    {
      id: 1,
      name: 'Dell Inspiron 5050',
      details: '32Gb / 512 SSD / i7',
      unitPrice: 2350.0,
      isAvailable: true,
      createdAt: '2026-04-10T12:00:00Z',
    },
    {
      id: 2,
      name: 'Headset 450p',
      details: 'Logitech Noise Cancelling',
      unitPrice: 459.0,
      isAvailable: false,
      createdAt: '2026-04-10T12:00:00Z',
    },
  ]

  it('renders item list correctly with items and availability', () => {
    render(
      <ItemList
        items={sampleItems}
        loading={false}
        error={null}
        onRefresh={vi.fn()}
      />
    )

    expect(screen.getByText('Dell Inspiron 5050')).toBeInTheDocument()
    expect(screen.getByText('Headset 450p')).toBeInTheDocument()
    expect(screen.getByText('Available')).toBeInTheDocument()
    expect(screen.getByText('Not Available')).toBeInTheDocument()
  })

  it('renders loading spinner when loading without items', () => {
    render(
      <ItemList
        items={[]}
        loading={true}
        error={null}
        onRefresh={vi.fn()}
      />
    )

    expect(screen.getByText(/Loading items from backend/i)).toBeInTheDocument()
  })

  it('renders error message when error occurs', () => {
    render(
      <ItemList
        items={[]}
        loading={false}
        error="Network error"
        onRefresh={vi.fn()}
      />
    )

    expect(screen.getByText('Network error')).toBeInTheDocument()
  })

  it('submits form with valid input', async () => {
    const user = userEvent.setup()
    const handleSubmit = vi.fn().mockResolvedValue({})

    render(<ItemForm onSubmit={handleSubmit} isSubmitting={false} />)

    await user.type(screen.getByLabelText(/Name/i), 'MacBook Pro')
    await user.type(screen.getByLabelText(/Details/i), 'M3 Max 64GB')
    await user.type(screen.getByLabelText(/Unit Price/i), '3499.00')

    await user.click(screen.getByRole('button', { name: /Create Item/i }))

    expect(handleSubmit).toHaveBeenCalledWith({
      name: 'MacBook Pro',
      details: 'M3 Max 64GB',
      unitPrice: 3499.0,
      isAvailable: true,
    })
  })

  it('validates empty item name', async () => {
    const handleSubmit = vi.fn()

    render(<ItemForm onSubmit={handleSubmit} isSubmitting={false} />)

    await act(async () => {
      const button = screen.getByRole('button', { name: /Create Item/i })
      button.click()
    })

    expect(screen.getByText('Item name is required.')).toBeInTheDocument()
    expect(handleSubmit).not.toHaveBeenCalled()
  })
})
