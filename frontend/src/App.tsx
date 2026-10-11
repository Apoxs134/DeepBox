import { useState } from 'react'
import { useProducts, ProductList, ProductForm } from './features/products'
import { useCart, CartModal } from './features/cart'
import { SettingsProvider, useSettings, SettingsModal } from './features/settings'

function AppContent() {
  const { products, loading, error, isSubmitting, reload, addProduct } = useProducts()
  const { items, totalCount, totalAmount, addToCart, removeFromCart, updateQuantity, clearCart } = useCart()
  const { role, t } = useSettings()

  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-900/40 text-lg">
              D
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white leading-tight tracking-tight">
                  {t('appTitle')}
                </h1>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    role === 'Admin'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-blue-950 text-blue-300 border border-blue-800'
                  }`}
                >
                  {role === 'Admin' ? t('roleAdmin') : t('roleUser')}
                </span>
              </div>
              <p className="text-xs text-slate-400">{t('appSubtitle')}</p>
            </div>
          </div>

          {/* Right Actions: Cart (Left of Settings) + Gear (Settings at Top Right) */}
          <div className="flex items-center gap-3">
            {/* 2. Buying cart at left of settings (Create order) */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2.5 px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 text-white rounded-xl border border-slate-700 transition-all shadow-sm group hover:border-slate-600"
              aria-label={t('cartButton')}
            >
              <div className="relative">
                <svg className="w-5 h-5 text-slate-300 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {/* Counter of how many products were selected */}
                {totalCount > 0 && (
                  <span className="absolute -top-2 -right-2.5 min-w-[20px] h-5 px-1 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shadow-md animate-scale-in">
                    {totalCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold hidden sm:inline text-slate-200">
                {t('cartButton')}
              </span>
              {totalAmount > 0 && (
                <span className="text-xs font-bold text-emerald-400 font-mono hidden md:inline ml-1 border-l border-slate-700 pl-2">
                  ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              )}
            </button>

            {/* 1. Gear button (settings) at top right */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="p-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-all shadow-sm hover:border-slate-600"
              title={t('settings')}
              aria-label={t('settings')}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* 4. Role-based view: Hide new product for user, only admin can see it */}
        {role === 'Admin' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <ProductForm onSubmit={addProduct} isSubmitting={isSubmitting} />
            </div>
            <div className="lg:col-span-2">
              <ProductList
                products={products}
                loading={loading}
                error={error}
                onRefresh={reload}
                onAddToCart={addToCart}
              />
            </div>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            <ProductList
              products={products}
              loading={loading}
              error={error}
              onRefresh={reload}
              onAddToCart={addToCart}
            />
          </div>
        )}
      </main>

      {/* Modals */}
      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={items}
        totalAmount={totalAmount}
        totalCount={totalCount}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  )
}

export function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  )
}

export default App
