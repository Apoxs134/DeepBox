import { useState, useEffect } from 'react'
import type { Provider, CreateRuleDto } from '../types'
import { ProviderDetailsModal } from './ProviderDetailsModal'
import { useSettings } from '../../settings'
import { useToast } from '../../toast'

interface ProvidersModalProps {
  isOpen: boolean
  onClose: () => void
  providers: Provider[]
  selectedProvider: Provider | null
  loading: boolean
  isSubmitting: boolean
  onFetchProviders: () => Promise<void>
  onSelectProvider: (provider: Provider) => void
  onDeselectProvider: () => void
  onAddProvider: (name: string) => Promise<unknown>
  onDeleteProvider: (id: number) => Promise<unknown>
  onAddRule: (providerId: number, dto: CreateRuleDto) => Promise<unknown>
  onDeleteRule: (providerId: number, ruleId: number) => Promise<unknown>
}

export function ProvidersModal({
  isOpen,
  onClose,
  providers,
  selectedProvider,
  loading,
  isSubmitting,
  onFetchProviders,
  onSelectProvider,
  onDeselectProvider,
  onAddProvider,
  onDeleteProvider,
  onAddRule,
  onDeleteRule,
}: ProvidersModalProps) {
  const { language } = useSettings()
  const { showSuccess, showError } = useToast()

  // 2.2: providers will have a + button to add a provider, when clicked will show an input text for the name of the provider, and will link
  const [showAddInput, setShowAddInput] = useState(false)
  const [newProviderName, setNewProviderName] = useState('')

  useEffect(() => {
    if (isOpen) {
      onFetchProviders()
      setShowAddInput(false)
      setNewProviderName('')
    }
  }, [isOpen, onFetchProviders])

  if (!isOpen) return null

  const handleCreateProvider = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProviderName.trim()) return

    try {
      await onAddProvider(newProviderName.trim())
      showSuccess(
        language === 'es'
          ? `Proveedor "${newProviderName.trim()}" agregado exitosamente.`
          : `Provider "${newProviderName.trim()}" created successfully.`,
        language === 'es' ? 'Proveedor Agregado' : 'Provider Added'
      )
      setNewProviderName('')
      setShowAddInput(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error adding provider'
      showError(msg, language === 'es' ? 'Error' : 'Error')
    }
  }

  const handleDeleteProvider = async (id: number, name: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await onDeleteProvider(id)
      showSuccess(
        language === 'es' ? `Proveedor "${name}" eliminado.` : `Provider "${name}" deleted.`,
        language === 'es' ? 'Proveedor Eliminado' : 'Provider Deleted'
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error deleting provider'
      showError(msg, language === 'es' ? 'Error' : 'Error')
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
        <div
          className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="providers-modal-title"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/90 backdrop-blur flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-600/20 text-amber-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h2 id="providers-modal-title" className="text-lg font-bold text-white flex items-center gap-2">
                  {language === 'es' ? 'Proveedores de Pago' : 'Payment Providers'}
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-900/60 text-amber-300 border border-amber-700/50">
                    {providers.length}
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  {language === 'es'
                    ? 'Gestiona las pasarelas de pago y sus reglas de cobro dinámicas'
                    : 'Manage payment gateways and dynamic commission rules'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* 2.2: + button to add a provider */}
              <button
                type="button"
                onClick={() => setShowAddInput((prev) => !prev)}
                className={`p-2 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold ${
                  showAddInput
                    ? 'bg-slate-700 text-white'
                    : 'bg-amber-600 hover:bg-amber-500 text-slate-950 shadow-md shadow-amber-950/50'
                }`}
                title={language === 'es' ? 'Agregar Proveedor' : 'Add Provider'}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={showAddInput ? 'M6 18L18 6M6 6l12 12' : 'M12 4v16m8-8H4'} />
                </svg>
                <span>{showAddInput ? (language === 'es' ? 'Cancelar' : 'Cancel') : (language === 'es' ? 'Nuevo' : 'New')}</span>
              </button>

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
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-4">
            {/* 2.2: When clicked, will show an input text for the name of the provider, and will link */}
            {showAddInput && (
              <form
                onSubmit={handleCreateProvider}
                className="p-4 rounded-xl bg-slate-950/90 border border-amber-600/40 shadow-lg animate-fade-in flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
              >
                <div className="flex-1">
                  <label htmlFor="new-provider-name" className="block text-[11px] font-bold uppercase tracking-wider text-amber-300 mb-1">
                    {language === 'es' ? 'Nombre del Nuevo Proveedor' : 'New Provider Name'}
                  </label>
                  <input
                    id="new-provider-name"
                    type="text"
                    value={newProviderName}
                    onChange={(e) => setNewProviderName(e.target.value)}
                    placeholder={language === 'es' ? 'ej. Stripe, OpenPay, MercadoPago...' : 'e.g. Stripe, OpenPay...'}
                    autoFocus
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg text-white text-xs placeholder-slate-500 outline-none transition-all"
                  />
                </div>
                <div className="flex items-center gap-2 self-end sm:self-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddInput(false)
                      setNewProviderName('')
                    }}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
                  >
                    {language === 'es' ? 'Cancelar' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={!newProviderName.trim() || isSubmitting}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-md shadow-amber-950/50 flex items-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    <span>{language === 'es' ? 'Vincular' : 'Link Provider'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Providers List */}
            {loading && providers.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs">{language === 'es' ? 'Cargando proveedores...' : 'Loading providers...'}</p>
              </div>
            ) : providers.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <p className="text-sm font-semibold text-slate-300">
                  {language === 'es' ? 'No hay proveedores registrados.' : 'No providers registered.'}
                </p>
                <p className="text-xs text-slate-500">
                  {language === 'es'
                    ? 'Haz clic en "+ Nuevo" para agregar tu primer proveedor.'
                    : 'Click "+ New" to add your first payment provider.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {providers.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => onSelectProvider(p)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onSelectProvider(p)
                      }
                    }}
                    className="group bg-slate-950/70 border border-slate-800 hover:border-amber-600/70 rounded-xl p-4 cursor-pointer transition-all hover:bg-slate-900/60 shadow-sm flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-amber-950/50 border border-amber-800/60 text-amber-400 flex items-center justify-center font-bold text-sm shrink-0">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                            {p.name}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                            {p.rules?.length || 0} {language === 'es' ? 'reglas' : 'rules'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {language === 'es'
                            ? `Haz clic para configurar reglas de cobro`
                            : `Click to configure fee rules`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Delete button (except seeded core providers or allow all) */}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteProvider(p.id, p.name, e)}
                        title={language === 'es' ? 'Eliminar proveedor' : 'Delete provider'}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/50 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>

                      <div className="p-2 rounded-lg bg-slate-800/80 text-slate-400 group-hover:text-white group-hover:bg-amber-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2.1: Clicking in a provider will open a modal with rules */}
      {selectedProvider && (
        <ProviderDetailsModal
          provider={selectedProvider}
          isOpen={Boolean(selectedProvider)}
          onClose={onDeselectProvider}
          onAddRule={onAddRule}
          onDeleteRule={onDeleteRule}
          isSubmitting={isSubmitting}
        />
      )}
    </>
  )
}
