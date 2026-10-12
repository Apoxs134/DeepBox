import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProvidersModal, RuleDialog, ProviderDetailsModal } from '../src/features/providers'
import { ToastProvider } from '../src/features/toast'
import { SettingsProvider } from '../src/features/settings'
import type { ReactNode } from 'react'

const sampleProviders = [
  {
    id: 1,
    name: 'PagaFacil',
    createdAt: new Date().toISOString(),
    rules: [
      {
        id: 10,
        providerId: 1,
        amount: 0,
        condition: 'MoreThan',
        percentage: 1.0,
        paymentMethod: 'Card',
        createdAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: 2,
    name: 'CazaPagos',
    createdAt: new Date().toISOString(),
    rules: [
      {
        id: 20,
        providerId: 2,
        amount: 1500,
        condition: 'EqualAndMoreThan',
        percentage: 1.5,
        paymentMethod: 'Card',
        createdAt: new Date().toISOString(),
      },
    ],
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

describe('Providers Feature Slice & Rules Engine', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders ProvidersModal with provider list and + button to add provider', async () => {
    const fetchMock = vi.fn().mockResolvedValue(undefined)
    const selectMock = vi.fn()

    renderWithProviders(
      <ProvidersModal
        isOpen={true}
        onClose={vi.fn()}
        providers={sampleProviders}
        selectedProvider={null}
        loading={false}
        isSubmitting={false}
        onFetchProviders={fetchMock}
        onSelectProvider={selectMock}
        onDeselectProvider={vi.fn()}
        onAddProvider={vi.fn()}
        onDeleteProvider={vi.fn()}
        onAddRule={vi.fn()}
        onDeleteRule={vi.fn()}
      />
    )

    // 2.1 Title and providers list
    expect(screen.getByText(/Proveedores de Pago|Payment Providers/i)).toBeInTheDocument()
    expect(screen.getByText('PagaFacil')).toBeInTheDocument()
    expect(screen.getByText('CazaPagos')).toBeInTheDocument()

    // 2.2 + button to add provider
    const addBtn = screen.getByTitle(/Agregar Proveedor|Add Provider/i)
    expect(addBtn).toBeInTheDocument()

    // Clicking + reveals input text for provider name
    fireEvent.click(addBtn)
    expect(screen.getByLabelText(/Nombre del Nuevo Proveedor|New Provider Name/i)).toBeInTheDocument()
  })

  it('RuleDialog enforces currency amount (default 0), condition dropdown, decimal percentage, and disabled save button', () => {
    const saveMock = vi.fn()

    renderWithProviders(
      <RuleDialog
        isOpen={true}
        providerName="PagaFacil"
        onClose={vi.fn()}
        onSave={saveMock}
        isSubmitting={false}
      />
    )

    // 2.1.2.1 Title
    expect(screen.getByText(/Nueva Regla de Comisión|New Provider Rule/i)).toBeInTheDocument()

    // 2.1.2.2 Amount input (default 0)
    const amountInput = screen.getByLabelText(/Monto \(Moneda\)|Amount \(Currency\)/i) as HTMLInputElement
    expect(amountInput.value).toBe('0')

    // 2.1.2.3 Dropdown with conditions (default more than)
    const conditionSelect = screen.getByLabelText(/Condición de Evaluación|Evaluation Condition/i) as HTMLSelectElement
    expect(conditionSelect.value).toBe('MoreThan')

    // 2.1.2.4 Percentage input
    const percentageInput = screen.getByLabelText(/Porcentaje de Comisión|Fee Percentage/i) as HTMLInputElement
    expect(percentageInput.value).toBe('')

    // 2.1.2.5 Save button disabled because percentage is empty
    const saveBtn = screen.getByRole('button', { name: /Guardar Regla|Save Rule/i })
    expect(saveBtn).toBeDisabled()

    // Enter valid percentage -> Save button becomes enabled
    fireEvent.change(percentageInput, { target: { value: '2.5' } })
    expect(saveBtn).not.toBeDisabled()

    // Submit rule
    fireEvent.click(saveBtn)
    expect(saveMock).toHaveBeenCalledWith({
      amount: 0,
      condition: 'MoreThan',
      percentage: 2.5,
      paymentMethod: 'Card',
    })
  })


  it('ProviderDetailsModal displays rules list with amount, condition, percentage, and delete button', async () => {
    const addRuleMock = vi.fn()
    const deleteRuleMock = vi.fn().mockResolvedValue(undefined)

    renderWithProviders(
      <ProviderDetailsModal
        provider={sampleProviders[1]}
        isOpen={true}
        onClose={vi.fn()}
        onAddRule={addRuleMock}
        onDeleteRule={deleteRuleMock}
      />
    )

    // Provider details title
    expect(screen.getByText('CazaPagos')).toBeInTheDocument()

    // 2.1.1 Rules list with amount, condition, percentage
    expect(screen.getByText(/\$1,500\.00/)).toBeInTheDocument()
    expect(screen.getByText('1.5%')).toBeInTheDocument()

    // Delete rule button
    const deleteRuleBtn = screen.getByTitle(/Eliminar regla|Delete rule/i)
    expect(deleteRuleBtn).toBeInTheDocument()

    fireEvent.click(deleteRuleBtn)
    expect(deleteRuleMock).toHaveBeenCalledWith(2, 20)
  })
})
