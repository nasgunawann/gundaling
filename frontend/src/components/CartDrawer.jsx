import React from 'react';
import ReceiptModal from './ReceiptModal';

export default function CartDrawer({
  isCartOpen,
  setIsCartOpen,
  selectedTable,
  activeCart,
  handleClearCart,
  handleUpdateItemNote,
  activeNoteItemId,
  setActiveNoteItemId,
  handleQtyChange,
  handleRemoveItem,
  subtotal,
  serviceCharge,
  grandTotal,
  handlePrintBill,
  handleSendToKitchen,
  handleSettleBill,
  hasUnsentItems,
  isPrinting,
  isSettling,
  isSendingToKitchen,
  showReceiptModal,
  setShowReceiptModal,
  handleTriggerSystemPrint
}) {
  return (
    <>
      {/* RIGHT: High-density Collapsible Billing & Cart Summary Side Panel */}
      <div 
        className={`fixed inset-y-0 right-0 z-50 w-[380px] sm:w-[420px] bg-surface flex flex-col h-full overflow-hidden shadow-[-8px_0_32px_rgba(0,0,0,0.12)] transition-transform duration-300 transform ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Panel Header */}
        <header className="px-6 py-6 border-b border-surface-container flex justify-between items-center bg-surface-container-low/20">
          <div>
            <h3 className="text-base font-bold font-display text-on-surface">Bill & Order Summary</h3>
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-0.5 font-mono">
              Active Session • {selectedTable}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeCart.length > 0 && (
              <button
                onClick={handleClearCart}
                className="p-2 text-outline hover:text-error hover:bg-error/10 rounded-xl transition-all"
                title="Clear Active Cart"
              >
                <span className="material-symbols-outlined text-lg">delete_sweep</span>
              </button>
            )}
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-outline hover:bg-surface-container rounded-xl transition-all"
              title="Close Drawer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </header>

        {/* Panel Receipt Content */}
        <div className="flex-grow overflow-y-auto px-6 py-4 custom-scrollbar bg-surface-container-lowest/15 flex flex-col justify-between">
          {/* Cart Items List */}
          {activeCart.length > 0 ? (
            <div className="flex flex-col gap-2">
              {activeCart.map((item) => (
                <div
                  key={item.cartItemId || item.id}
                  className={`bg-surface p-2.5 rounded-xl border transition-all ${
                    item.sent
                      ? 'border-outline-variant/10 opacity-85'
                      : 'border-outline-variant/20 group hover:border-primary/10'
                  } shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex justify-between items-center`}
                >
                  <div className="flex flex-col gap-1 max-w-[160px]">
                    <h4 className={`text-xs font-bold leading-tight truncate ${item.sent ? 'text-on-surface-variant' : 'text-on-surface group-hover:text-primary transition-colors'}`}>
                      {item.name}
                    </h4>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-bold text-primary font-display">Rp {Math.floor(item.price).toLocaleString('id-ID')}</p>
                      {!item.sent ? (
                        <span className="inline-flex items-center gap-1 text-[8px] font-bold text-status-pending uppercase bg-status-pending/10 border border-status-pending/20 px-1.5 py-0.5 rounded-full select-none">
                          <span className="w-1 h-1 rounded-full bg-status-pending"></span>Draft
                        </span>
                      ) : item.status === 'preparing' ? (
                        <span className="inline-flex items-center gap-1 text-[8px] font-bold text-status-occupied uppercase bg-status-occupied/10 border border-status-occupied/20 px-1.5 py-0.5 rounded-full select-none">
                          <span className="w-1 h-1 rounded-full bg-status-occupied animate-pulse"></span>Cooking
                        </span>
                      ) : item.status === 'ready' ? (
                        <span className="inline-flex items-center gap-1 text-[8px] font-bold text-status-success uppercase bg-status-success/10 border border-status-success/20 px-1.5 py-0.5 rounded-full select-none">
                          <span className="w-1 h-1 rounded-full bg-status-success animate-bounce"></span>Ready for Pickup
                        </span>
                      ) : item.status === 'served' ? (
                        <span className="inline-flex items-center gap-1 text-[8px] font-bold text-status-reserved uppercase bg-status-reserved/10 border border-status-reserved/20 px-1.5 py-0.5 rounded-full select-none">
                          <span className="w-1 h-1 rounded-full bg-status-reserved"></span>Served
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[8px] font-bold text-status-warning uppercase bg-status-warning/10 border border-status-warning/20 px-1.5 py-0.5 rounded-full select-none">
                          <span className="w-1 h-1 rounded-full bg-status-warning animate-pulse"></span>In Queue
                        </span>
                      )}
                    </div>
                    {item.sent ? (
                      item.note && (
                        <p className="text-[10px] italic text-amber-800 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-lg mt-1 leading-tight">
                          "{item.note}"
                        </p>
                      )
                    ) : (
                      <>
                        {item.note || activeNoteItemId === item.cartItemId ? (
                          <textarea
                            value={item.note || ''}
                            onChange={(e) => handleUpdateItemNote(item.cartItemId, e.target.value)}
                            placeholder="Tulis catatan..."
                            className="min-h-[48px] w-full rounded-xl border border-outline-variant/10 bg-surface-container-low px-3 py-2 text-[10px] leading-snug text-on-surface resize-none outline-none focus:border-primary/15 focus:ring-1 focus:ring-primary/15 mt-1"
                            autoFocus={activeNoteItemId === item.cartItemId}
                            onBlur={() => {
                              if (!item.note) setActiveNoteItemId(null);
                            }}
                          />
                        ) : (
                          <button
                            onClick={() => setActiveNoteItemId(item.cartItemId)}
                            className="text-[10px] font-bold text-primary hover:opacity-85 flex items-center gap-1 mt-1 text-left"
                          >
                            <span className="material-symbols-outlined text-[14px]">edit_note</span>
                            Tambah Catatan
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {item.sent ? (
                    <span className="text-xs font-bold font-mono text-on-surface-variant bg-surface-container-low rounded-lg px-2.5 py-1">
                      x{item.qty}
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-surface-container rounded-xl border border-outline-variant/25 p-0.5">
                        <button
                          onClick={() => handleQtyChange(item.cartItemId, -1)}
                          className="w-11 h-11 rounded-lg hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant font-bold active:scale-90 transition-all"
                        >
                          <span className="material-symbols-outlined text-sm font-bold">remove</span>
                        </button>
                        <span className="w-8 text-center text-xs font-bold font-mono text-on-surface">{item.qty}</span>
                        <button
                          onClick={() => handleQtyChange(item.cartItemId, 1)}
                          className="w-11 h-11 rounded-lg hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant font-bold active:scale-90 transition-all"
                        >
                          <span className="material-symbols-outlined text-sm font-bold">add</span>
                        </button>
                      </div>

                      <button
                        onClick={() => handleRemoveItem(item.cartItemId)}
                        className="w-11 h-11 hover:bg-error/10 text-outline-variant hover:text-error rounded-xl transition-all flex items-center justify-center"
                        title="Remove Item"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="my-auto flex flex-col items-center justify-center text-center p-6 text-on-surface-variant/70">
              <span className="material-symbols-outlined text-[54px] opacity-35 mb-2.5" style={{ fontVariationSettings: '"FILL" 1' }}>
                restaurant_menu
              </span>
              <p className="text-xs font-bold font-display uppercase tracking-wider">No active table bill</p>
              <p className="text-[11px] max-w-xs mt-1 leading-relaxed px-4">
                Choose any item from the organic menu on the left to immediately start constructing the billing receipt for {selectedTable}.
              </p>
            </div>
          )}
        </div>

        {/* Panel Billing Totals and Dynamic Actions */}
        <footer className="p-6 border-t border-outline-variant/35 bg-surface-container-low/30 flex flex-col gap-5">
          <div className="space-y-2 text-xs font-bold text-on-surface-variant/95 uppercase tracking-wider">
            <div className="flex justify-between items-center">
              <span>Subtotal</span>
              <span className="font-mono text-sm font-semibold text-on-surface">Rp {Math.floor(subtotal).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Service Charge (10%)</span>
              <span className="font-mono text-sm font-semibold text-on-surface">Rp {Math.floor(serviceCharge).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-outline-variant/30">
              <span className="text-sm font-extrabold text-on-surface">Grand Billing Total</span>
              <span className="text-2xl font-bold font-display text-primary leading-none">
                Rp {Math.floor(grandTotal).toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-1">
            <button
              onClick={handlePrintBill}
              disabled={activeCart.length === 0 || isPrinting || isSettling || isSendingToKitchen}
              className="h-14 border-2 border-primary/20 rounded-xl font-bold text-primary hover:bg-primary/5 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:scale-100 text-xs uppercase tracking-wider"
            >
              <span className={`material-symbols-outlined text-base ${isPrinting ? 'animate-spin' : ''}`}>
                {isPrinting ? 'sync' : 'print'}
              </span>
              {isPrinting ? 'Queuing...' : 'Print Bill'}
            </button>

            {hasUnsentItems ? (
              <button
                onClick={handleSendToKitchen}
                disabled={activeCart.length === 0 || isPrinting || isSettling || isSendingToKitchen}
                className="h-14 bg-tertiary text-on-tertiary rounded-xl font-bold shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:scale-100 text-xs uppercase tracking-wider"
              >
                <span className={`material-symbols-outlined text-base ${isSendingToKitchen ? 'animate-spin' : ''}`}>
                  {isSendingToKitchen ? 'sync' : 'soup_kitchen'}
                </span>
                {isSendingToKitchen ? 'Sending...' : 'Send to Kitchen'}
              </button>
            ) : (
              <button
                onClick={handleSettleBill}
                disabled={activeCart.length === 0 || isPrinting || isSettling || isSendingToKitchen}
                className="h-14 bg-primary text-on-primary rounded-xl font-bold shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:scale-100 text-xs uppercase tracking-wider"
              >
                <span className={`material-symbols-outlined text-base ${isSettling ? 'animate-spin' : ''}`}>
                  {isSettling ? 'sync' : 'payments'}
                </span>
                {isSettling ? 'Settling...' : 'Settle Bill'}
              </button>
            )}
          </div>
        </footer>
      </div>

      {/* Backdrop for drawer */}
      {isCartOpen && (
        <div 
          onClick={() => setIsCartOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 transition-opacity duration-300"
        />
      )}

      <ReceiptModal
        open={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        onPrint={handleTriggerSystemPrint}
        isPrinting={isPrinting}
        selectedTable={selectedTable}
        activeCart={activeCart}
        subtotal={subtotal}
        serviceCharge={serviceCharge}
        grandTotal={grandTotal}
      />
    </>
  );
}
