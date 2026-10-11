import { useState, type FormEvent } from 'react'
import type { CreateItemDto } from '../types'

interface ItemFormProps {
  onSubmit: (dto: CreateItemDto) => Promise<unknown>
  isSubmitting?: boolean
}

export function ItemForm({ onSubmit, isSubmitting = false }: ItemFormProps) {
  const [name, setName] = useState('')
  const [details, setDetails] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [isAvailable, setIsAvailable] = useState(true)
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (!name.trim()) {
      setLocalError('Item name is required.')
      return
    }

    const price = parseFloat(unitPrice)
    if (isNaN(price) || price < 0) {
      setLocalError('Please enter a valid non-negative price.')
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
      setLocalError(err instanceof Error ? err.message : 'Failed to create item')
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
      <h2 className="text-xl font-semibold text-white mb-4">Add New Item</h2>

      {localError && (
        <div className="mb-4 p-3 bg-red-950/60 border border-red-800 text-red-200 text-sm rounded-lg">
          {localError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="itemName" className="block text-sm font-medium text-slate-300 mb-1">
            Name
          </label>
          <input
            id="itemName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. MacBook Pro 16"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="itemDetails" className="block text-sm font-medium text-slate-300 mb-1">
            Details / Specifications
          </label>
          <input
            id="itemDetails"
            type="text"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="e.g. 32GB RAM / 1TB SSD / M3 Pro"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="itemPrice" className="block text-sm font-medium text-slate-300 mb-1">
            Unit Price ($)
          </label>
          <input
            id="itemPrice"
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
            id="itemAvailable"
            type="checkbox"
            checked={isAvailable}
            onChange={(e) => setIsAvailable(e.target.checked)}
            className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-700 focus:ring-blue-500"
            disabled={isSubmitting}
          />
          <label htmlFor="itemAvailable" className="text-sm font-medium text-slate-300">
            Available in stock
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-150 shadow-md"
        >
          {isSubmitting ? 'Creating Item...' : 'Create Item'}
        </button>
      </form>
    </div>
  )
}
