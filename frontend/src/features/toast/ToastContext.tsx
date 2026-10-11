import React, { createContext, useContext, useState, useCallback } from 'react'
import type { ToastItem } from './types'

interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, 'id'>) => void
  showSuccess: (message: string, title?: string) => void
  showError: (message: string, title?: string) => void
  dismissToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(({ type, title, message }: Omit<ToastItem, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    setToasts((prev) => [...prev, { id, type, title, message }])

    // Auto dismiss after 4.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4500)
  }, [])

  const showSuccess = useCallback((message: string, title?: string) => {
    showToast({ type: 'success', title: title ?? 'Success', message })
  }, [showToast])

  const showError = useCallback((message: string, title?: string) => {
    showToast({ type: 'error', title: title ?? 'Error', message })
  }, [showToast])

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, dismissToast }}>
      {children}
      {/* 5. Toast at bottom left */}
      <div 
        aria-live="polite" 
        aria-atomic="true"
        className="fixed bottom-5 left-5 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none"
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success'
          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-slide-up ${
                isSuccess
                  ? 'bg-emerald-950/95 border-emerald-600/60 text-emerald-100 shadow-emerald-950/50'
                  : 'bg-rose-950/95 border-rose-600/60 text-rose-100 shadow-rose-950/50'
              }`}
            >
              {/* Icon */}
              <div
                className={`p-1 rounded-lg shrink-0 ${
                  isSuccess ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                }`}
              >
                {isSuccess ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>

              {/* Text Body */}
              <div className="flex-1 min-w-0 pr-1">
                {toast.title && (
                  <h4 className="text-xs font-bold tracking-wide uppercase opacity-90 mb-0.5">
                    {toast.title}
                  </h4>
                )}
                <p className="text-xs leading-relaxed font-medium break-words">
                  {toast.message}
                </p>
              </div>

              {/* Dismiss Button */}
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="text-white/60 hover:text-white p-1 rounded hover:bg-white/10 transition-colors shrink-0"
                aria-label="Dismiss toast"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    return {
      showToast: () => {},
      showSuccess: () => {},
      showError: () => {},
      dismissToast: () => {},
    }
  }
  return context
}

