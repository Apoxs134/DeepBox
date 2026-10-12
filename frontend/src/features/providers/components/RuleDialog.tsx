import { useState } from 'react'
import type { CreateRuleDto } from '../types'
import { useSettings } from '../../settings'

interface RuleDialogProps {
  isOpen: boolean
  providerName: string
  onClose: () => void
  onSave: (rule: CreateRuleDto) => Promise<void>
  isSubmitting?: boolean
}

export function RuleDialog({
  isOpen,
  providerName,
  onClose,
  onSave,
  isSubmitting = false,
}: RuleDialogProps) {
  const { language } = useSettings()

  // 2.1.2.2: input amount that will only accept currency (default 0)
  const [amountStr, setAmountStr] = useState<string>('0')
  // 2.1.2.3: drop down that defines more than, equal and more than, less than, equal and less than. (more than default)
  const [condition, setCondition] = useState<string>('MoreThan')
  // 2.1.2.4: percentage that will only accept decimal number
  const [percentageStr, setPercentageStr] = useState<string>('')
  // 2: payment method toggle: TDC (Card), Cash, Transfer
  const [paymentMethod, setPaymentMethod] = useState<'Card' | 'Cash' | 'Transfer'>('Card')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  // Currency input handler (allows numbers with up to 2 decimal places)
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    // Allow empty, or digits, optionally followed by . and up to 2 decimals
    if (val === '' || /^\d*(\.\d{0,2})?$/.test(val)) {
      setAmountStr(val)
      setErrorMsg(null)
    }
  }

  // Decimal percentage handler (allows numbers with optional decimal point)
  const handlePercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    // Allow empty, or digits, optionally followed by . and any decimals
    if (val === '' || /^\d*(\.\d*)?$/.test(val)) {
      setPercentageStr(val)
      setErrorMsg(null)
    }
  }

  // 2.1.2.5: Save button enabled only when amount and percentage have valid values
  const parsedAmount = amountStr !== '' ? parseFloat(amountStr) : NaN
  const parsedPercentage = percentageStr !== '' ? parseFloat(percentageStr) : NaN
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount >= 0
  const isValidPercentage = !isNaN(parsedPercentage) && parsedPercentage >= 0 && percentageStr.trim() !== ''
  const isSaveEnabled = isValidAmount && isValidPercentage && !isSubmitting

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isSaveEnabled) return

    try {
      await onSave({
        amount: parsedAmount,
        condition,
        percentage: parsedPercentage,
        paymentMethod,
      })
      // Reset form
      setAmountStr('0')
      setCondition('MoreThan')
      setPercentageStr('')
      setPaymentMethod('Card')
      onClose()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save rule')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rule-dialog-title"
      >
        {/* 2.1.2.1: Title */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <div>
              <h3 id="rule-dialog-title" className="text-base font-bold text-white">
                {language === 'es' ? 'Nueva Regla de Comisión' : 'New Provider Rule'}
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'es' ? `Vinculada a ${providerName}` : `Linked to ${providerName}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label={language === 'es' ? 'Cerrar' : 'Close'}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800 text-rose-200 text-xs rounded-xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 2: Toggle for TDC (Card) and other payment methods */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              {language === 'es' ? 'Método de Pago' : 'Payment Method'}
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setPaymentMethod('Card')}
                className={`py-2 px-2 rounded-lg text-xs font-bold transition-all text-center ${
                  paymentMethod === 'Card'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                TDC
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('Cash')}
                className={`py-2 px-2 rounded-lg text-xs font-bold transition-all text-center ${
                  paymentMethod === 'Cash'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {language === 'es' ? 'Efectivo' : 'Cash'}
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('Transfer')}
                className={`py-2 px-2 rounded-lg text-xs font-bold transition-all text-center ${
                  paymentMethod === 'Transfer'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {language === 'es' ? 'Transferencia' : 'Transfer'}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {language === 'es' ? 'La regla solo aplicará para transacciones con este método.' : 'Rule only applies for transactions with this method.'}
            </p>
          </div>

          {/* 2.1.2.2: Input Amount (Currency only, default 0) */}
          <div>
            <label htmlFor="rule-amount" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              {language === 'es' ? 'Monto (Moneda)' : 'Amount (Currency)'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-sm">
                $
              </span>
              <input
                id="rule-amount"
                type="text"
                inputMode="decimal"
                value={amountStr}
                onChange={handleAmountChange}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2.5 bg-slate-950/80 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-white font-mono text-sm placeholder-slate-500 outline-none transition-all"
                required
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {language === 'es' ? 'Monto límite para evaluar la regla.' : 'Threshold amount to evaluate the rule.'}
            </p>
          </div>

          {/* 2.1.2.3: Condition Dropdown (more than, equal and more than, less than, equal and less than; more than default) */}
          <div>
            <label htmlFor="rule-condition" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              {language === 'es' ? 'Condición de Evaluación' : 'Evaluation Condition'}
            </label>
            <div className="relative">
              <select
                id="rule-condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-white text-sm outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="MoreThan">
                  {language === 'es' ? 'more than (Mayor que >)' : 'more than (>)'}
                </option>
                <option value="EqualAndMoreThan">
                  {language === 'es' ? 'equal and more than (Mayor o igual que >=)' : 'equal and more than (>=)'}
                </option>
                <option value="LessThan">
                  {language === 'es' ? 'less than (Menor que <)' : 'less than (<)'}
                </option>
                <option value="EqualAndLessThan">
                  {language === 'es' ? 'equal and less than (Menor o igual que <=)' : 'equal and less than (<=)'}
                </option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>


          {/* 2.1.2.4: Percentage input (Decimal number only) */}
          <div>
            <label htmlFor="rule-percentage" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              {language === 'es' ? 'Porcentaje de Comisión (%)' : 'Fee Percentage (%)'}
            </label>
            <div className="relative">
              <input
                id="rule-percentage"
                type="text"
                inputMode="decimal"
                value={percentageStr}
                onChange={handlePercentageChange}
                placeholder="ej. 1.5"
                className="w-full px-4 pr-9 py-2.5 bg-slate-950/80 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-white font-mono text-sm placeholder-slate-500 outline-none transition-all"
                required
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-sm">
                %
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {language === 'es' ? 'Acepta solo valores decimales (ej. 1.5 o 0.5).' : 'Accepts decimal numbers only (e.g. 1.5 or 0.5).'}
            </p>
          </div>

          {/* 2.1.2.5: Save button (Enabled ONLY when amount and percentage have valid values) */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
            >
              {language === 'es' ? 'Cancelar' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={!isSaveEnabled}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-950/50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  <span>{language === 'es' ? 'Guardando...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{language === 'es' ? 'Guardar Regla' : 'Save Rule'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
