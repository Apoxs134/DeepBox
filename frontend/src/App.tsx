import { useState } from 'react'
import { useProducts, ProductList, type Product } from './features/products'
import { useCart, CartModal } from './features/cart'
import { SettingsProvider, useSettings, SettingsModal } from './features/settings'
import { ToastProvider, useToast } from './features/toast'
import { OrderHistoryModal } from './features/orders'
import { useProviders, ProvidersModal } from './features/providers'

function AppContent() {
  const { products, loading, error, reload } = useProducts()
  const { items, totalCount, totalAmount, addToCart, removeFromCart, updateQuantity, clearCart } = useCart()
  const { role, language, t } = useSettings()
  const { showSuccess } = useToast()

  const {
    providers,
    selectedProvider,
    loading: providersLoading,
    isSubmitting: isProvidersSubmitting,
    fetchProviders,
    selectProvider,
    deselectProvider,
    addProviderAction,
    deleteProviderAction,
    addRuleAction,
    deleteRuleAction,
  } = useProviders(true)

  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isOrderHistoryOpen, setIsOrderHistoryOpen] = useState(false)
  const [isProvidersModalOpen, setIsProvidersModalOpen] = useState(false)

  const handleAddToCart = (product: Product) => {
    addToCart(product)
    showSuccess(
      language === 'es' ? `"${product.name}" agregado al carrito` : `"${product.name}" added to cart`,
      language === 'es' ? 'Carrito' : 'Cart'
    )
  }


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

          {/* Right Actions: Cart, Order History, Providers (Admin only, left of Settings), Settings */}
          <div className="flex items-center gap-3">
            {/* Cart Button */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 px-3 py-2 bg-slate-800/90 hover:bg-slate-700 text-white rounded-xl border border-slate-700 transition-all shadow-sm group hover:border-slate-600"
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
              {totalAmount > 0 && (
                <span className="text-xs font-bold text-emerald-400 font-mono ml-0.5">
                  ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              )}
            </button>

            {/* Orders history button */}
            <button
              type="button"
              onClick={() => setIsOrderHistoryOpen(true)}
              className="p-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-all shadow-sm hover:border-slate-600"
              title={t('ordersHistoryBtn')}
              aria-label={t('ordersHistoryBtn')}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </button>

            {/* 2. In admin role, button in left of settings with an icon for providers */}
            {role === 'Admin' && (
              <button
                type="button"
                onClick={() => setIsProvidersModalOpen(true)}
                className="p-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-amber-400 rounded-xl border border-slate-700 hover:border-amber-600/50 transition-all shadow-sm"
                title={t('providersBtn')}
                aria-label={t('providersBtn')}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </button>
            )}

            {/* Gear button (settings) at top right */}
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

      {/* Main Content: Add new product hidden for admin */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <ProductList
            products={products}
            loading={loading}
            error={error}
            onRefresh={reload}
            onAddToCart={handleAddToCart}
          />
        </div>
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
        providers={providers}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenOrderHistory={() => setIsOrderHistoryOpen(true)}
      />

      <OrderHistoryModal
        isOpen={isOrderHistoryOpen}
        onClose={() => setIsOrderHistoryOpen(false)}
      />

      <ProvidersModal
        isOpen={isProvidersModalOpen}
        onClose={() => setIsProvidersModalOpen(false)}
        providers={providers}
        selectedProvider={selectedProvider}
        loading={providersLoading}
        isSubmitting={isProvidersSubmitting}
        onFetchProviders={fetchProviders}
        onSelectProvider={selectProvider}
        onDeselectProvider={deselectProvider}
        onAddProvider={addProviderAction}
        onDeleteProvider={deleteProviderAction}
        onAddRule={addRuleAction}
        onDeleteRule={deleteRuleAction}
      />
    </div>
  )
}

export function App() {
  return (
    <SettingsProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </SettingsProvider>
  )
}

export default App
