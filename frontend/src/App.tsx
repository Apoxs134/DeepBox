import { useItems, ItemList, ItemForm } from './features/items'

export function App() {
  const { items, loading, error, isSubmitting, reload, addItem } = useItems()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-md">
              D
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">DeepBox</h1>
              <p className="text-xs text-slate-400">Vertical Slice Architecture</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Backend: SQLite Minimal API
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Form Slice */}
          <div className="lg:col-span-1">
            <ItemForm onSubmit={addItem} isSubmitting={isSubmitting} />
          </div>

          {/* List Items Slice */}
          <div className="lg:col-span-2">
            <ItemList
              items={items}
              loading={loading}
              error={error}
              onRefresh={reload}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
