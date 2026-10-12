import { useState } from 'react'
import type { Provider, CreateRuleDto } from '../types'
import { RuleDialog } from './RuleDialog'
import { useSettings } from '../../settings'
import { useToast } from '../../toast'

interface ProviderDetailsModalProps {
  provider: Provider | null
  isOpen: boolean
  onClose: () => void
  onAddRule: (providerId: number, dto: CreateRuleDto) => Promise<unknown>
  onDeleteRule: (providerId: number, ruleId: number) => Promise<unknown>
  isSubmitting?: boolean
}

export function ProviderDetailsModal({
  provider,
  isOpen,
  onClose,
  onAddRule,
  onDeleteRule,
  isSubmitting = false,
}: ProviderDetailsModalProps) {
  const { language } = useSettings()
  const { showSuccess, showError } = useToast()
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false)
  const [deletingRuleId, setDeletingRuleId] = useState<number | null>(null)

  if (!isOpen || !provider) return null

  const formatCurrency = (val: number) => {
    return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatPaymentMethod = (pm?: string) => {
    switch ((pm || '').toLowerCase()) {
      case 'card':
        return 'TDC'
      case 'cash':
        return language === 'es' ? 'Efectivo' : 'Cash'
      case 'transfer':
        return language === 'es' ? 'Transferencia' : 'Transfer'
      default:
        return pm || 'TDC'
    }
  }

  const formatCondition = (condition: string) => {
    switch (condition) {
      case 'MoreThan':
        return language === 'es' ? 'Mayor que (>)' : 'More than (>)'
      case 'EqualAndMoreThan':
        return language === 'es' ? 'Mayor o igual (>=)' : 'Equal and more than (>=)'
      case 'LessThan':
        return language === 'es' ? 'Menor que (<)' : 'Less than (<)'
      case 'EqualAndLessThan':
        return language === 'es' ? 'Menor o igual (<=)' : 'Equal and less than (<=)'
      default:
        return condition
    }
  }


  const handleSaveRule = async (dto: CreateRuleDto) => {
    try {
      await onAddRule(provider.id, dto)
      showSuccess(
        language === 'es'
          ? `Regla agregada exitosamente a ${provider.name}.`
          : `Rule added successfully to ${provider.name}.`,
        language === 'es' ? 'Regla Creada' : 'Rule Created'
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error adding rule'
      showError(msg, language === 'es' ? 'Error' : 'Error')
      throw err
    }
  }

  const handleDeleteRule = async (ruleId: number) => {
    try {
      setDeletingRuleId(ruleId)
      await onDeleteRule(provider.id, ruleId)
      showSuccess(
        language === 'es'
          ? `Regla eliminada exitosamente.`
          : `Rule deleted successfully.`,
        language === 'es' ? 'Regla Eliminada' : 'Rule Deleted'
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error deleting rule'
      showError(msg, language === 'es' ? 'Error' : 'Error')
    } finally {
      setDeletingRuleId(null)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
        <div
          className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="provider-details-title"
        >
          {/* 2.1.1: Title Header */}
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/90 backdrop-blur flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1 text-xs font-semibold"
                aria-label={language === 'es' ? 'Volver a proveedores' : 'Back to providers'}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>{language === 'es' ? 'Volver' : 'Back'}</span>
              </button>

              <div>
                <h2 id="provider-details-title" className="text-lg font-bold text-white flex items-center gap-2">
                  {provider.name}
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-900/60 text-blue-300 border border-blue-700/50">
                    ID #{provider.id}
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  {language === 'es'
                    ? 'Reglas de comisión vinculadas y optimización de pagos'
                    : 'Linked fee calculation rules and payment optimization'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
              aria-label={language === 'es' ? 'Cerrar' : 'Close'}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-5">
            {/* 2.1.1: Rules list header with Add button */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  {language === 'es' ? 'Reglas de Comisión' : 'Commission Rules'}
                </h3>
                <p className="text-xs text-slate-400">
                  {language === 'es'
                    ? 'Determina la comisión que aplicará este proveedor según el total de la orden.'
                    : 'Determines the fee applied by this provider according to the order total.'}
                </p>
              </div>

              {/* Add rule button -> opens RuleDialog */}
              <button
                type="button"
                onClick={() => setIsRuleDialogOpen(true)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-950/50 flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                <span>{language === 'es' ? 'Agregar Regla' : 'Add Rule'}</span>
              </button>
            </div>

            {/* 2.1.1: Rules list: amount / condition / percentage / delete button */}
            {(!provider.rules || provider.rules.length === 0) ? (
              <div className="p-8 rounded-xl bg-slate-950/60 border border-slate-800 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mx-auto">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h4 className="text-xs font-semibold text-slate-300">
                  {language === 'es' ? 'Sin reglas configuradas' : 'No rules configured'}
                </h4>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  {language === 'es'
                    ? 'Haz clic en "Agregar Regla" para vincular una condición de comisión a este proveedor.'
                    : 'Click "Add Rule" to link a commission rule to this provider.'}
                </p>
              </div>
            ) : (
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800">
                <div className="grid grid-cols-12 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/90">
                  <div className="col-span-3">{language === 'es' ? 'Monto' : 'Amount'}</div>
                  <div className="col-span-3">{language === 'es' ? 'Condición' : 'Condition'}</div>
                  <div className="col-span-3">{language === 'es' ? 'Método' : 'Method'}</div>
                  <div className="col-span-2 text-right">{language === 'es' ? 'Porcentaje' : 'Percentage'}</div>
                  <div className="col-span-1 text-center">{language === 'es' ? 'Acción' : 'Action'}</div>
                </div>

                {provider.rules.map((rule) => (
                  <div key={rule.id} className="grid grid-cols-12 px-4 py-3 items-center hover:bg-slate-900/40 transition-colors">
                    <div className="col-span-3 font-mono font-bold text-white text-sm">
                      {formatCurrency(rule.amount)}
                    </div>
                    <div className="col-span-3 text-xs font-medium text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {formatCondition(rule.condition)}
                      </span>
                    </div>
                    <div className="col-span-3 text-xs font-medium text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/60 font-semibold">
                        {formatPaymentMethod(rule.paymentMethod)}
                      </span>
                    </div>
                    <div className="col-span-2 text-right font-mono font-bold text-amber-400 text-sm">
                      {rule.percentage}%
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteRule(rule.id)}
                        disabled={isSubmitting || deletingRuleId === rule.id}
                        title={language === 'es' ? 'Eliminar regla' : 'Delete rule'}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 disabled:opacity-40 transition-colors"
                      >
                        {deletingRuleId === rule.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            )}
          </div>
        </div>
      </div>

      {/* 2.1.2: Add Rule Dialog */}
      <RuleDialog
        isOpen={isRuleDialogOpen}
        providerName={provider.name}
        onClose={() => setIsRuleDialogOpen(false)}
        onSave={handleSaveRule}
        isSubmitting={isSubmitting}
      />
    </>
  )
}
