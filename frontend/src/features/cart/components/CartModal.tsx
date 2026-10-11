import { useState } from 'react'
import type { CartItem, PaymentMethod, OrderConfirmationResult } from '../types'
import { useSettings } from '../../settings'

interface CartModalProps {
  isOpen: boolean
  onClose: () => void
  items: CartItem[]
  totalAmount: number
  totalCount: number
  onUpdateQuantity: (productId: number, delta: number) => void
  onRemoveItem: (productId: number) => void
  onClearCart: () => void
}

export function CartModal({
  isOpen,
  onClose,
  items,
  totalAmount,
  totalCount,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}: CartModalProps) {
  const { t } = useSettings()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmation, setConfirmation] = useState<OrderConfirmationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleConfirmOrder = async () => {
    if (items.length === 0) return
    setIsSubmitting(true)
    setError(null)

    // Optimal provider calculation per challenge rules:
    // Cash: PagaFacil ($15)
    // Transfer: CazaPagos ($5 if <= 500, 2.5% if <= 1000, 2.0% if > 1000)
    // Card: compare PagaFacil (1%) vs CazaPagos (0-1.5k: 2%, 1.5k-5k: 1.5%, >5k: 0.5%)
    let provider = 'PagaFacil'
    if (paymentMethod === 'Transfer') {
      provider = 'CazaPagos'
    } else if (paymentMethod === 'Card') {
      const pagaFee = totalAmount * 0.01
      let cazaFee = totalAmount * 0.02
      if (totalAmount > 5000) cazaFee = totalAmount * 0.005
      else if (totalAmount > 1500) cazaFee = totalAmount * 0.015

      provider = cazaFee < pagaFee ? 'CazaPagos' : 'PagaFacil'
    }

    const payload = {
      provider,
      method: paymentMethod,
      products: items.flatMap((i) =>
        Array.from({ length: i.quantity }, () => ({
          name: i.product.name,
          unitPrice: i.product.unitPrice,
        }))
      ),
    }

    try {
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `HTTP ${response.status}`)
      }

      const result = await response.json()
      const totalFee = (result.fees ?? []).reduce(
        (sum: number, f: { amount: number }) => sum + f.amount,
        0
      )

      setConfirmation({
        orderId: result.externalOrderId ?? `ORD-${Date.now()}`,
        provider: result.provider ?? provider,
        method: result.method ?? paymentMethod,
        amount: result.amount ?? totalAmount,
        fee: totalFee,
        status: result.status ?? 'Created',
      })

      onClearCart()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error confirming payment order')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setConfirmation(null)
    setError(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      {/* Modal with 90% height requirement */}
      <div
        className="relative w-full max-w-2xl h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-modal-title"
      >
        {/* 2.1 FIXED TOP HEADER: Title and Dynamic Total */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/90 backdrop-blur flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <h2 id="cart-modal-title" className="text-lg font-bold text-white flex items-center gap-2">
                {t('modalOrderTitle')}
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-900/60 text-blue-300 border border-blue-700/50">
                  {totalCount} {t('qty')}
                </span>
              </h2>
              <p className="text-xs text-slate-400">{t('cartItemsCount')}</p>
            </div>
          </div>

          {/* Dynamic Total in fixed header */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block">
                {t('modalTotalLabel')}
              </span>
              <span className="text-xl font-extrabold text-emerald-400 font-mono">
                ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
              aria-label={t('close')}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 2.2 SCROLLABLE BODY: List of Added Products (Product & Unit Price) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {confirmation ? (
            /* Order Confirmation Result Card */
            <div className="bg-emerald-950/40 border border-emerald-800/80 rounded-2xl p-6 text-center space-y-4 my-auto">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white">{t('orderSuccessTitle')}</h3>
              <p className="text-sm text-emerald-200/80">{t('orderSuccessDesc')}</p>

              <div className="grid grid-cols-2 gap-3 text-left bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 block">{t('orderId')}</span>
                  <span className="text-slate-200 font-mono font-medium truncate block">{confirmation.orderId}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">{t('providerAssigned')}</span>
                  <span className="text-blue-400 font-semibold">{confirmation.provider}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">{t('paymentMethodTitle')}</span>
                  <span className="text-slate-300 font-medium">{confirmation.method}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">{t('feeAmount')}</span>
                  <span className="text-amber-400 font-semibold font-mono">${confirmation.fee.toFixed(2)}</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-800 flex justify-between items-center text-sm">
                  <span className="text-slate-400">{t('modalTotalLabel')}:</span>
                  <span className="text-emerald-400 font-bold font-mono text-base">${confirmation.amount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : items.length === 0 ? (
            /* Empty state */
            <div className="h-full flex flex-col items-center justify-center text-center py-16 text-slate-500">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4 text-slate-600">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p className="text-sm max-w-sm">{t('emptyCart')}</p>
            </div>
          ) : (
            /* Products List with Product Name, Details and Unit Price */
            <div className="space-y-3">
              {items.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-white truncate">{product.name}</h4>
                    <p className="text-xs text-slate-400 truncate">{product.details || '—'}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-slate-500">{t('unitPrice')}:</span>
                      <span className="text-xs font-semibold text-emerald-400 font-mono">
                        ${product.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Quantity and Subtotal Controls */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5">
                      <button
                        onClick={() => onUpdateQuantity(product.id, -1)}
                        className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors text-sm font-bold"
                        title="Decrease"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-white font-mono">
                        {quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(product.id, 1)}
                        className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors text-sm font-bold"
                        title="Increase"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right w-24">
                      <span className="text-xs font-mono font-bold text-white block">
                        ${(product.unitPrice * quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <button
                        onClick={() => onRemoveItem(product.id)}
                        className="text-[11px] text-rose-400 hover:text-rose-300 transition-colors"
                      >
                        {t('remove')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-200 text-xs rounded-xl">
              {error}
            </div>
          )}
        </div>

        {/* 2.3 FIXED BOTTOM FOOTER: Payment Type Toggle + Confirm Button */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/95 backdrop-blur shrink-0 space-y-4 z-10">
          {!confirmation ? (
            <>
              {/* Payment Type Toggle: 3 Options */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">
                  {t('paymentMethodTitle')}
                </label>
                <div className="grid grid-cols-3 gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Cash')}
                    className={`py-2 px-3 rounded-lg text-xs font-medium transition-all text-center flex flex-col items-center justify-center gap-1 ${
                      paymentMethod === 'Cash'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span className="font-semibold">{t('paymentCash')}</span>
                    <span className="text-[10px] opacity-75">PagaFacil ($15)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Card')}
                    className={`py-2 px-3 rounded-lg text-xs font-medium transition-all text-center flex flex-col items-center justify-center gap-1 ${
                      paymentMethod === 'Card'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span className="font-semibold">{t('paymentCard')}</span>
                    <span className="text-[10px] opacity-75">Óptimo (1% - 0.5%)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Transfer')}
                    className={`py-2 px-3 rounded-lg text-xs font-medium transition-all text-center flex flex-col items-center justify-center gap-1 ${
                      paymentMethod === 'Transfer'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span className="font-semibold">{t('paymentTransfer')}</span>
                    <span className="text-[10px] opacity-75">CazaPagos ($5 - 2%)</span>
                  </button>
                </div>
              </div>

              {/* Confirm Button below toggle */}
              <button
                type="button"
                disabled={items.length === 0 || isSubmitting}
                onClick={handleConfirmOrder}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    {t('btnConfirming')}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {t('btnConfirmOrder')} (${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleClose}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors"
            >
              {t('close')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
