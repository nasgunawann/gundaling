import React, { createContext, useContext, useState } from 'react'
import api from '../api'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const [toast, setToast] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState(null)
  const [managerPinModal, setManagerPinModal] = useState(null)

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

  const requestManagerApproval = (message = 'Manager PIN authorization required to proceed.') => {
    return new Promise((resolve) => {
      setManagerPinModal({
        message,
        pin: '',
        error: '',
        submitting: false,
        resolve
      })
    })
  }

  const handlePinNumClick = (num) => {
    if (!managerPinModal) return
    if (managerPinModal.pin.length < 4) {
      setManagerPinModal(prev => ({
        ...prev,
        pin: prev.pin + num,
        error: ''
      }))
    }
  }

  const handlePinBackspace = () => {
    if (!managerPinModal) return
    setManagerPinModal(prev => ({
      ...prev,
      pin: prev.pin.slice(0, -1)
    }))
  }

  const handlePinClear = () => {
    if (!managerPinModal) return
    setManagerPinModal(prev => ({
      ...prev,
      pin: '',
      error: ''
    }))
  }

  const handlePinSubmit = async () => {
    if (!managerPinModal) return
    if (managerPinModal.pin.length !== 4) {
      setManagerPinModal(prev => ({ ...prev, error: 'PIN must be 4 digits.' }))
      return
    }

    setManagerPinModal(prev => ({ ...prev, submitting: true, error: '' }))
    try {
      await api.post('/auth/verify-manager-pin', { pin: managerPinModal.pin })
      const resolve = managerPinModal.resolve
      setManagerPinModal(null)
      resolve(true)
    } catch (err) {
      setManagerPinModal(prev => ({
        ...prev,
        submitting: false,
        pin: '',
        error: err.response?.data?.message || 'Invalid Manager PIN.'
      }))
    }
  }

  const handlePinCancel = () => {
    if (!managerPinModal) return
    const resolve = managerPinModal.resolve
    setManagerPinModal(null)
    resolve(false)
  }

  return (
    <NotificationContext.Provider value={{ showToast, showConfirm, requestManagerApproval }}>
      {children}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-[100] flex items-center gap-3 bg-surface border border-outline-variant/30 px-5 py-4 rounded-2xl shadow-xl max-w-sm animate-in slide-in-from-top-4 duration-75">
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
        <div className="fixed inset-0 z-[99] flex items-center justify-center p-6 bg-black/60">
          <div className="bg-surface w-full max-w-md rounded-3xl shadow-2xl p-6 border border-outline-variant/30">
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

      {/* Manager PIN Modal */}
      {managerPinModal && (
        <div className="fixed inset-0 z-[99] flex items-center justify-center p-6 bg-black/60 select-none">
          <div className="bg-surface w-full max-w-md rounded-3xl shadow-2xl p-6 border border-outline-variant/30 flex flex-col gap-5">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-3 border border-primary/20 shadow-sm">
                <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: '"FILL" 1' }}>
                  shield
                </span>
              </div>
              <h3 className="text-base font-bold font-display text-on-surface mb-1">Supervisor Authorization</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed px-4">{managerPinModal.message}</p>
            </div>

            <div className="flex justify-between items-center bg-surface-container-low h-12 rounded-xl px-8 border-2 border-transparent focus-within:border-primary shadow-sm w-3/4 mx-auto">
              <div className="flex gap-4 mx-auto">
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className={`w-3.5 h-3.5 rounded-full ${index < managerPinModal.pin.length ? 'bg-primary scale-110 shadow-sm' : 'bg-outline-variant/60'}`}
                  />
                ))}
              </div>
            </div>

            {managerPinModal.error && (
              <div className="text-error text-xs font-bold text-center flex items-center justify-center gap-1.5 bg-error/10 py-2 rounded-lg border border-error/20 mx-4">
                <span className="material-symbols-outlined text-sm">error</span>
                {managerPinModal.error}
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 px-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handlePinNumClick(num.toString())}
                  className="h-11 font-display font-bold text-base bg-surface-container-high rounded-xl text-on-surface shadow-sm active:scale-95 active:bg-outline-variant/20 transition-all flex items-center justify-center"
                >
                  {num}
                </button>
              ))}

              <button
                onClick={handlePinBackspace}
                className="h-11 bg-surface-container-high rounded-xl text-error/80 shadow-sm active:scale-95 active:bg-error/10 transition-all flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-lg font-bold">backspace</span>
              </button>

              <button
                onClick={() => handlePinNumClick('0')}
                className="h-11 font-display font-bold text-base bg-surface-container-high rounded-xl text-on-surface shadow-sm active:scale-95 active:bg-outline-variant/20 transition-all flex items-center justify-center"
              >
                0
              </button>

              <button
                onClick={handlePinClear}
                className="h-11 rounded-xl bg-surface-container-high border border-outline-variant/20 text-on-surface-variant shadow-sm active:scale-95 active:bg-outline-variant/20 transition-all flex items-center justify-center text-[10px] font-bold uppercase tracking-wider"
              >
                Clear
              </button>
            </div>

            <div className="flex gap-3 justify-end px-6 mt-2">
              <button
                onClick={handlePinCancel}
                className="px-6 py-2.5 border border-outline-variant/35 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container active:scale-95 transition-all uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                onClick={handlePinSubmit}
                disabled={managerPinModal.submitting}
                className="px-6 py-2.5 bg-primary text-on-primary rounded-xl text-xs font-bold shadow-md hover:shadow-lg active:scale-95 transition-all uppercase tracking-wider flex items-center gap-1.5"
              >
                {managerPinModal.submitting ? 'Verifying...' : 'Approve'}
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
