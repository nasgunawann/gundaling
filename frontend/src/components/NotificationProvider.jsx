import React, { createContext, useContext, useState } from 'react'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const [toast, setToast] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState(null)

  const showToast = (message, type = 'success') => {
    // Clear any existing toast timer
    if (window.toastTimer) {
      clearTimeout(window.toastTimer)
    }
    
    setToast({ message, type })
    
    window.toastTimer = setTimeout(() => {
      setToast(null)
    }, 4000)
  }

  const showConfirm = (title, message) => {
    return new Promise((resolve) => {
      setConfirmDialog({
        title,
        message,
        onConfirm: () => {
          setConfirmDialog(null)
          resolve(true)
        },
        onCancel: () => {
          setConfirmDialog(null)
          resolve(false)
        }
      })
    })
  }

  return (
    <NotificationContext.Provider value={{ showToast, showConfirm }}>
      {children}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-[100] flex items-center gap-3 bg-surface border border-outline-variant/30 px-5 py-4 rounded-2xl shadow-xl max-w-sm animate-in slide-in-from-top-4 duration-300">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
            toast.type === 'success' ? 'bg-primary/10 text-primary' :
            toast.type === 'error' ? 'bg-error/10 text-error' : 'bg-secondary/10 text-secondary'
          }`}>
            <span className="material-symbols-outlined text-lg">
              {toast.type === 'success' ? 'check_circle' :
               toast.type === 'error' ? 'error' : 'info'}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-on-surface leading-tight">{toast.message}</p>
          </div>
          <button 
            onClick={() => setToast(null)} 
            className="ml-2 text-outline hover:text-on-surface transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[99] flex items-center justify-center p-6 bg-black/60 animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-md rounded-3xl shadow-2xl p-6 border border-outline-variant/30 animate-in zoom-in-95 duration-200">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shrink-0 border border-primary/20 shadow-sm">
                <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: '"FILL" 1' }}>
                  help
                </span>
              </div>
              <div className="flex-grow">
                <h3 className="text-base font-bold font-display text-on-surface mb-2 leading-snug">{confirmDialog.title}</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">{confirmDialog.message}</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={confirmDialog.onCancel}
                className="px-6 py-2.5 border border-outline-variant/35 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container active:scale-95 transition-all uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="px-6 py-2.5 bg-primary text-on-primary rounded-xl text-xs font-bold shadow-md hover:shadow-lg active:scale-95 transition-all uppercase tracking-wider"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}
