import { useState, type FormEvent } from 'react'
import type { CreateProductDto } from '../types'
import { useSettings } from '../../settings'

interface ProductFormProps {
  onSubmit: (dto: CreateProductDto) => Promise<unknown>
  isSubmitting?: boolean
}

export function ProductForm({ onSubmit, isSubmitting = false }: ProductFormProps) {
  const { t } = useSettings()
  const [name, setName] = useState('')
  const [details, setDetails] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [isAvailable, setIsAvailable] = useState(true)
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (!name.trim()) {
      setLocalError(t('errNameRequired'))
      return
    }

    const price = parseFloat(unitPrice)
    if (isNaN(price) || price < 0) {
      setLocalError(t('errPriceInvalid'))
      return
    }

    try {
      await onSubmit({
        name: name.trim(),
        details: details.trim(),
        unitPrice: price,
        isAvailable,
      })
      setName('')
      setDetails('')
      setUnitPrice('')
      setIsAvailable(true)
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : t('errCreateFailed'))
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
      <h2 className="text-xl font-semibold text-white mb-4">{t('formTitle')}</h2>

      {localError && (
        <div className="mb-4 p-3 bg-red-950/60 border border-red-800 text-red-200 text-sm rounded-lg">
          {localError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="productName" className="block text-sm font-medium text-slate-300 mb-1">
            {t('labelName')}
          </label>
          <input
            id="productName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('placeholderName')}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="productDetails" className="block text-sm font-medium text-slate-300 mb-1">
            {t('labelDetails')}
          </label>
          <input
            id="productDetails"
            type="text"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder={t('placeholderDetails')}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="productPrice" className="block text-sm font-medium text-slate-300 mb-1">
            {t('labelPrice')}
          </label>
          <input
            id="productPrice"
            type="number"
            step="0.01"
            min="0"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            placeholder="0.00"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="productAvailable"
            type="checkbox"
            checked={isAvailable}
            onChange={(e) => setIsAvailable(e.target.checked)}
            className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-700 focus:ring-blue-500"
            disabled={isSubmitting}
          />
          <label htmlFor="productAvailable" className="text-sm font-medium text-slate-300">
            {t('labelAvailable')}
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-150 shadow-md"
        >
          {isSubmitting ? t('btnCreating') : t('btnCreate')}
        </button>
      </form>
    </div>
  )
}
