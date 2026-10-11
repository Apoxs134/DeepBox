import { useEffect } from 'react'
import { useOrders } from '../hooks/useOrders'
import { useToast } from '../../toast'
import { useSettings } from '../../settings'

interface OrderHistoryModalProps {
  isOpen: boolean
  onClose: () => void
}

export function OrderHistoryModal({ isOpen, onClose }: OrderHistoryModalProps) {
  const { t, language } = useSettings()
  const { showSuccess, showError } = useToast()
  const {
    orders,
    selectedOrder,
    loading,
    error,
    isSubmitting,
    loadOrders,
    selectOrder,
    deselectOrder,
    cancelOrderAction,
  } = useOrders(false)

  useEffect(() => {
    if (isOpen) {
      loadOrders()
      deselectOrder()
    }
  }, [isOpen, loadOrders, deselectOrder])

  if (!isOpen) return null

  const handleCancelOrder = async () => {
    if (!selectedOrder) return
    const orderIdToCancel = selectedOrder.orderId
    try {
      await cancelOrderAction(orderIdToCancel)
      showSuccess(
        language === 'es'
          ? `La orden #${orderIdToCancel} fue cancelada exitosamente con el proveedor.`
          : `Order #${orderIdToCancel} was successfully cancelled with provider.`,
        language === 'es' ? 'Orden Cancelada' : 'Order Cancelled'
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error cancelling order'
      showError(
        language === 'es'
          ? `No se pudo cancelar la orden #${orderIdToCancel}: ${msg}`
          : `Failed to cancel order #${orderIdToCancel}: ${msg}`,
        language === 'es' ? 'Error al Cancelar' : 'Cancellation Failed'
      )
    }
  }

  const formatCurrency = (val: number) => {
    return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatDate = (isoStr: string) => {
    try {
      const date = new Date(isoStr)
      return date.toLocaleString(language === 'es' ? 'es-MX' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    } catch {
      return isoStr
    }
  }

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase()
    if (s === 'cancelled' || s === 'cancelada') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-800">
          {language === 'es' ? 'Cancelada' : 'Cancelled'}
        </span>
      )
    }
    if (s === 'paid' || s === 'pagada') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
          {language === 'es' ? 'Pagada' : 'Paid'}
        </span>
      )
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-800">
        {language === 'es' ? 'Creada / Pendiente' : 'Created / Pending'}
      </span>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-3xl h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-history-title"
      >
        {/* 4.1 / Selected Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/90 backdrop-blur flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {selectedOrder ? (
              /* 4.2 <- button to return to orders */
              <button
                type="button"
                onClick={deselectOrder}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1 text-xs font-semibold"
                aria-label={language === 'es' ? 'Volver a órdenes' : 'Back to orders'}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>{language === 'es' ? 'Volver' : 'Back'}</span>
              </button>
            ) : (
              <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            )}

            <div>
              <h2 id="order-history-title" className="text-lg font-bold text-white flex items-center gap-2">
                {selectedOrder
                  ? (language === 'es' ? `Orden #${selectedOrder.orderId}` : `Order #${selectedOrder.orderId}`)
                  : (language === 'es' ? 'Historial de Órdenes' : 'Orders History')}
                {!selectedOrder && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-900/60 text-blue-300 border border-blue-700/50">
                    {orders.length}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                {selectedOrder
                  ? (language === 'es' ? 'Detalle completo y gestión de cancelación' : 'Complete details and cancellation management')
                  : (language === 'es' ? 'Registro histórico de transacciones procesadas' : 'Historical record of processed transactions')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!selectedOrder && (
              <button
                type="button"
                onClick={loadOrders}
                disabled={loading}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors text-xs flex items-center gap-1.5"
                title={language === 'es' ? 'Actualizar' : 'Refresh'}
              >
                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
              aria-label={t('close')}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-200 text-xs rounded-xl">
              {error}
            </div>
          )}

          {/* View 1: 4.2 List of all the orders */}
          {!selectedOrder ? (
            loading && orders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-16 gap-3">
                <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs">{language === 'es' ? 'Cargando órdenes...' : 'Loading orders...'}</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 py-16 gap-3 text-center">
                <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-slate-600">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-300">
                    {language === 'es' ? 'No hay órdenes registradas' : 'No orders recorded'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {language === 'es' ? 'Las órdenes que confirmes aparecerán aquí.' : 'Confirmed orders will appear here.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((ord) => (
                  <div
                    key={ord.orderId}
                    onClick={() => selectOrder(ord)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        selectOrder(ord)
                      }
                    }}
                    className="group bg-slate-950/70 border border-slate-800 hover:border-blue-600/70 rounded-xl p-4 cursor-pointer transition-all hover:bg-slate-900/60 shadow-sm flex items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="font-mono text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                          #{ord.orderId}
                        </span>
                        {getStatusBadge(ord.status)}
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          {ord.provider?.id || 'Provider'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-900 text-slate-400 border border-slate-800">
                          {ord.paymentMode}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>{formatDate(ord.createdAt)}</span>
                        <span>•</span>
                        <span>{ord.products?.length || 0} {language === 'es' ? 'productos' : 'products'}</span>
                        {ord.fees?.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-amber-400 font-mono">
                              {language === 'es' ? 'Comisión' : 'Fee'}: {formatCurrency(ord.fees.reduce((acc, f) => acc + f.amount, 0))}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <span className="text-base font-extrabold text-emerald-400 font-mono block">
                          {formatCurrency(ord.amount)}
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                          {language === 'es' ? 'Total' : 'Total'}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-800/80 text-slate-400 group-hover:text-white group-hover:bg-blue-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* View 2: Detailed dialog showing all info of the selected order + Cancel button */
            <div className="space-y-6">
              {/* Header Overview Card */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 block mb-1">
                    {language === 'es' ? 'Estado' : 'Status'}
                  </span>
                  <div>{getStatusBadge(selectedOrder.status)}</div>
                </div>

                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 block mb-1">
                    {language === 'es' ? 'Proveedor' : 'Provider'}
                  </span>
                  <span className="text-sm font-semibold text-blue-400">
                    {selectedOrder.provider?.id || '—'}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 block mb-1">
                    {language === 'es' ? 'Modo de Pago' : 'Payment Mode'}
                  </span>
                  <span className="text-sm font-medium text-slate-200">
                    {selectedOrder.paymentMode}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 block mb-1">
                    {language === 'es' ? 'Total' : 'Total Amount'}
                  </span>
                  <span className="text-lg font-extrabold text-emerald-400 font-mono">
                    {formatCurrency(selectedOrder.amount)}
                  </span>
                </div>

                <div className="col-span-2 sm:col-span-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                  <div>
                    <span className="text-slate-500 mr-2">{language === 'es' ? 'ID Externo:' : 'External ID:'}</span>
                    <span className="font-mono text-slate-300 select-all">{selectedOrder.externalOrderId}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 mr-2">{language === 'es' ? 'Fecha:' : 'Created Date:'}</span>
                    <span>{formatDate(selectedOrder.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Products Section */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>{language === 'es' ? 'Productos de la Orden' : 'Order Products'}</span>
                  <span className="text-slate-500">({selectedOrder.products?.length || 0})</span>
                </h3>
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/60">
                  {(selectedOrder.products || []).map((prod, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-md bg-slate-800 text-slate-400 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-semibold text-slate-200">{prod.name}</span>
                      </div>
                      <span className="text-sm font-bold text-emerald-400 font-mono">
                        {formatCurrency(prod.unitPrice)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fees Section */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>{language === 'es' ? 'Comisiones del Proveedor (Fees)' : 'Provider Fees'}</span>
                  <span className="text-amber-400 font-mono">
                    {formatCurrency((selectedOrder.fees || []).reduce((acc, f) => acc + f.amount, 0))}
                  </span>
                </h3>
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/60">
                  {(selectedOrder.fees || []).length === 0 ? (
                    <div className="p-3 text-xs text-slate-500 italic">
                      {language === 'es' ? 'Sin comisiones registradas' : 'No fees registered'}
                    </div>
                  ) : (
                    (selectedOrder.fees || []).map((fee, idx) => (
                      <div key={idx} className="p-3.5 flex items-center justify-between gap-4">
                        <span className="text-xs font-medium text-slate-300">{fee.name}</span>
                        <span className="text-xs font-semibold text-amber-400 font-mono">
                          {formatCurrency(fee.amount)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 4.3 Cancel order button action */}
              <div className="pt-4 border-t border-slate-800">
                {selectedOrder.status.toLowerCase() === 'cancelled' || selectedOrder.status.toLowerCase() === 'cancelada' ? (
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-400 text-xs flex items-center gap-3">
                    <svg className="w-5 h-5 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>
                      {language === 'es'
                        ? 'Esta orden se encuentra cancelada ante el proveedor.'
                        : 'This order is currently cancelled with the provider.'}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-rose-950/20 border border-rose-900/40 p-4 rounded-xl">
                    <div className="text-left">
                      <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wide">
                        {language === 'es' ? 'Zona de Cancelación' : 'Order Cancellation'}
                      </h4>
                      <p className="text-xs text-rose-200/70 mt-0.5">
                        {language === 'es'
                          ? 'Se enviará una solicitud de cancelación directamente al proveedor.'
                          : 'A cancellation request will be submitted directly to the provider.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleCancelOrder}
                      className="w-full sm:w-auto px-4 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                          <span>{language === 'es' ? 'Cancelando...' : 'Cancelling...'}</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span>{language === 'es' ? 'Cancelar Orden' : 'Cancel Order'}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
