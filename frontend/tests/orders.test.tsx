import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { OrderHistoryModal } from '../src/features/orders'
import { ToastProvider, useToast } from '../src/features/toast'
import { SettingsProvider } from '../src/features/settings'
import type { ReactNode } from 'react'

const sampleOrders = [
  {
    orderId: 101,
    externalOrderId: 'ext-uuid-101',
    amount: 3421.0,
    fees: [
      { name: 'Purchase Fee', amount: 15.0 },
      { name: 'Interchange Fee', amount: 0.6 },
    ],
    products: [
      { name: 'Laptop Lenovo', unitPrice: 2221.0 },
      { name: 'Laptop Dell', unitPrice: 1200.0 },
    ],
    provider: { id: 'PagaFacil' },
    status: 'Created',
    paymentMode: 'Cash',
    createdAt: new Date().toISOString(),
  },
]

function renderWithProviders(ui: ReactNode) {
  return render(
    <SettingsProvider>
      <ToastProvider>
        {ui}
      </ToastProvider>
    </SettingsProvider>
  )
}

describe('Orders Feature Slice & Toast Notifications', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders OrderHistoryModal with 4.1 Title and 4.2 List of orders', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => sampleOrders,
    } as Response)

    renderWithProviders(<OrderHistoryModal isOpen={true} onClose={vi.fn()} />)

    // 4.1 Title
    expect(screen.getByText(/Historial de Órdenes|Orders History/i)).toBeInTheDocument()

    // 4.2 Order item in list
    await waitFor(() => {
      expect(screen.getByText('#101')).toBeInTheDocument()
      expect(screen.getByText('PagaFacil')).toBeInTheDocument()
      expect(screen.getByText(/\$3,421\.00/)).toBeInTheDocument()
    })
  })

  it('clicking an order opens detail dialog with <- back button and cancel action', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => sampleOrders,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => sampleOrders[0],
      } as Response)

    renderWithProviders(<OrderHistoryModal isOpen={true} onClose={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('#101')).toBeInTheDocument()
    })

    // Click order item to open details
    fireEvent.click(screen.getByText('#101'))

    // 4.2 Detailed dialog with <- back button
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Volver|Back/i })).toBeInTheDocument()
      expect(screen.getByText('ext-uuid-101')).toBeInTheDocument()
      expect(screen.getByText('Laptop Lenovo')).toBeInTheDocument()
      expect(screen.getByText('Laptop Dell')).toBeInTheDocument()
      expect(screen.getByText('Purchase Fee')).toBeInTheDocument()
    })

    // 4.3 Cancel order button
    const cancelBtn = screen.getByRole('button', { name: /Cancelar Orden|Cancel Order/i })
    expect(cancelBtn).toBeInTheDocument()

    // Test back button returns to list
    const backBtn = screen.getByRole('button', { name: /Volver|Back/i })
    fireEvent.click(backBtn)

    await waitFor(() => {
      expect(screen.getByText(/Historial de Órdenes|Orders History/i)).toBeInTheDocument()
    })
  })

  it('cancelling an order calls external cancellation and displays success toast', async () => {
    const cancelledOrder = { ...sampleOrders[0], status: 'Cancelled' }

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => sampleOrders,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => sampleOrders[0],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => cancelledOrder,
      } as Response)

    renderWithProviders(<OrderHistoryModal isOpen={true} onClose={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('#101')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('#101'))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Cancelar Orden|Cancel Order/i })).toBeInTheDocument()
    })

    const cancelBtn = screen.getByRole('button', { name: /Cancelar Orden|Cancel Order/i })
    fireEvent.click(cancelBtn)

    // 5. Toast at bottom left
    await waitFor(() => {
      expect(screen.getByText(/Orden Cancelada|Order Cancelled/i)).toBeInTheDocument()
    })
  })

  it('renders Toast notifications triggered from useToast', async () => {
    function TestComponent() {
      const { showSuccess, showError } = useToast()
      return (
        <div>
          <button onClick={() => showSuccess('Operación exitosa')}>Trigger Success</button>
          <button onClick={() => showError('Error en operación')}>Trigger Error</button>
        </div>
      )
    }

    renderWithProviders(<TestComponent />)

    fireEvent.click(screen.getByText('Trigger Success'))
    expect(screen.getByText('Operación exitosa')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Trigger Error'))
    expect(screen.getByText('Error en operación')).toBeInTheDocument()
  })
})
