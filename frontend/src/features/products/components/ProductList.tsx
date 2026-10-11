import { useState } from 'react'
import type { Product } from '../types'
import { useSettings } from '../../settings'

interface ProductListProps {
  products: Product[]
  loading: boolean
  error: string | null
  onRefresh: () => void
  onAddToCart?: (product: Product) => void
}

export function ProductList({
  products,
  loading,
  error,
  onRefresh,
  onAddToCart,
}: ProductListProps) {
  const { t } = useSettings()
  const [justAddedId, setJustAddedId] = useState<number | null>(null)

  const handleAdd = (product: Product) => {
    if (!product.isAvailable || !onAddToCart) return
    onAddToCart(product)
    setJustAddedId(product.id)
    setTimeout(() => {
      setJustAddedId((curr) => (curr === product.id ? null : curr))
    }, 1200)
  }

  if (loading && products.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent text-blue-500 rounded-full mb-2"></div>
        <p>Loading products from backend...</p>
      </div>
    )
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold text-white">{t('catalogTitle')}</h2>
          <p className="text-xs text-slate-400">
            {products.length} {t('productsRegistered')}
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md border border-slate-700 transition-colors"
        >
          {t('refresh')}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-950/60 border border-red-800 text-red-200 text-sm rounded-lg">
          {error}
        </div>
      )}

      {products.length === 0 ? (
        <p className="text-slate-500 text-center py-8">{t('noProducts')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th scope="col" className="px-4 py-3">{t('colId')}</th>
                <th scope="col" className="px-4 py-3">{t('colName')}</th>
                <th scope="col" className="px-4 py-3">{t('colDetails')}</th>
                <th scope="col" className="px-4 py-3">{t('colPrice')}</th>
                <th scope="col" className="px-4 py-3">{t('colStatus')}</th>
                <th scope="col" className="px-4 py-3 text-right">{t('colAction')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {products.map((product) => {
                const isJustAdded = justAddedId === product.id

                return (
                  <tr key={product.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">#{product.id}</td>
                    <td className="px-4 py-3 font-medium text-white">{product.name}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{product.details || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-400">
                      ${product.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      {product.isAvailable ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {t('statusAvailable')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-950 text-rose-300 border border-rose-800">
                          {t('statusNotAvailable')}
                        </span>
                      )}
                    </td>
                    {/* 3. Add to buying cart button */}
                    <td className="px-4 py-3 text-right">
                      {product.isAvailable ? (
                        <button
                          type="button"
                          onClick={() => handleAdd(product)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm flex items-center gap-1.5 ml-auto ${
                            isJustAdded
                              ? 'bg-emerald-600 text-white'
                              : 'bg-blue-600 hover:bg-blue-500 text-white'
                          }`}
                        >
                          {isJustAdded ? (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                              {t('addedToCart')}
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              {t('addToCart')}
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          title={t('cannotAddNotAvailable')}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 text-slate-500 cursor-not-allowed ml-auto border border-slate-800"
                        >
                          {t('addToCart')}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
