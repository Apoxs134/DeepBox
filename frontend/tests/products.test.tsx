import { describe, it, expect, vi } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductList } from '../src/features/products/components/ProductList'
import { ProductForm } from '../src/features/products/components/ProductForm'
import { CartModal } from '../src/features/cart/components/CartModal'
import { SettingsProvider, SettingsModal } from '../src/features/settings'
import type { Product } from '../src/features/products/types'
import type { CartItem } from '../src/features/cart/types'

function renderWithSettings(ui: React.ReactElement) {
  return render(<SettingsProvider>{ui}</SettingsProvider>)
}

describe('Products Feature Slice & User Flows', () => {
  const sampleProducts: Product[] = [
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

  it('renders product list with products, availability and Add button', () => {
    const handleAddToCart = vi.fn()

    renderWithSettings(
      <ProductList
        products={sampleProducts}
        loading={false}
        error={null}
        onRefresh={vi.fn()}
        onAddToCart={handleAddToCart}
      />
    )

    expect(screen.getByText('Dell Inspiron 5050')).toBeInTheDocument()
    expect(screen.getByText('Headset 450p')).toBeInTheDocument()

    // Add button for available item
    const addButtons = screen.getAllByRole('button', { name: /Add|Agregar/i })
    expect(addButtons.length).toBeGreaterThan(0)

    // Click available product add button
    fireEvent.click(addButtons[0])
    expect(handleAddToCart).toHaveBeenCalledWith(sampleProducts[0])
  })

  it('disables add button for Not Available product', () => {
    const handleAddToCart = vi.fn()

    renderWithSettings(
      <ProductList
        products={sampleProducts}
        loading={false}
        error={null}
        onRefresh={vi.fn()}
        onAddToCart={handleAddToCart}
      />
    )

    const addButtons = screen.getAllByRole('button', { name: /Add|Agregar/i })
    // The second product is not available, button should be disabled
    expect(addButtons[1]).toBeDisabled()
    fireEvent.click(addButtons[1])
    expect(handleAddToCart).not.toHaveBeenCalled()
  })

  it('submits product form with valid input', async () => {
    const user = userEvent.setup()
    const handleSubmit = vi.fn().mockResolvedValue({})

    renderWithSettings(<ProductForm onSubmit={handleSubmit} isSubmitting={false} />)

    await user.type(screen.getByLabelText(/Product Name|Nombre del Producto/i), 'MacBook Pro')
    await user.type(screen.getByLabelText(/Details|Detalles/i), 'M3 Max 64GB')
    await user.type(screen.getByLabelText(/Unit Price|Precio/i), '3499.00')

    await user.click(screen.getByRole('button', { name: /Create Product|Crear Producto/i }))

    expect(handleSubmit).toHaveBeenCalledWith({
      name: 'MacBook Pro',
      details: 'M3 Max 64GB',
      unitPrice: 3499.0,
      isAvailable: true,
    })
  })

  it('renders CartModal with products list, fixed dynamic total, and 3 payment options', () => {
    const sampleCartItems: CartItem[] = [
      { product: sampleProducts[0], quantity: 2 },
    ]

    renderWithSettings(
      <CartModal
        isOpen={true}
        onClose={vi.fn()}
        items={sampleCartItems}
        totalAmount={4700.0}
        totalCount={2}
        onUpdateQuantity={vi.fn()}
        onRemoveItem={vi.fn()}
        onClearCart={vi.fn()}
      />
    )

    // Modal title & product in list
    expect(screen.getByText(/Shopping Order|Orden de Compra/i)).toBeInTheDocument()
    expect(screen.getByText('Dell Inspiron 5050')).toBeInTheDocument()

    // 3 Payment type options: Pago en Efectivo, Pago en TDC, Transferencia
    expect(screen.getByText('Pago en Efectivo')).toBeInTheDocument()
    expect(screen.getByText('Pago en TDC')).toBeInTheDocument()
    expect(screen.getByText('Transferencia')).toBeInTheDocument()

    // Dynamic total
    expect(screen.getAllByText(/\$4,700\.00/).length).toBeGreaterThan(0)
  })

  it('renders SettingsModal with Role and Language toggles and Order History button', () => {
    renderWithSettings(<SettingsModal isOpen={true} onClose={vi.fn()} onOpenOrderHistory={vi.fn()} />)

    expect(screen.getByRole('button', { name: /Admin|Administrador/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /User|Usuario/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /English|Inglés/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Spanish|Español/i })).toBeInTheDocument()
    expect(screen.getByText(/Historial de Órdenes|Orders History/i)).toBeInTheDocument()
  })
})
