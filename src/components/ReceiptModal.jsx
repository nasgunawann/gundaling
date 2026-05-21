import React from 'react'

export default function ReceiptModal({
  open,
  onClose,
  onPrint,
  isPrinting,
  selectedTable,
  activeCart,
  subtotal,
  serviceCharge,
  grandTotal
}) {
  if (!open) return null

  const now = new Date()
  const invoiceNumber = `GND-${Math.floor(1000 + Math.random() * 9000)}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #receipt-print-sheet, #receipt-print-sheet * {
            visibility: visible !important;
          }
          #receipt-print-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            margin: 0 !important;
            padding: 16px !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
          }
          .receipt-modal-overlay {
            display: none !important;
          }
        }
      `}</style>

      <div className="receipt-modal-overlay w-full max-w-[420px] bg-surface rounded-3xl border border-outline-variant/20 shadow-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-on-surface-variant">
              Bill Invoice
            </p>
            <h3 className="text-xl font-bold text-on-surface">Receipt</h3>
          </div>
          <button
            onClick={onClose}
            className="h-10 w-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition"
            aria-label="Close receipt"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <div id="receipt-print-sheet" className="rounded-3xl border border-outline-variant/20 bg-white p-4 text-[11px] text-on-surface">
          <div className="mb-4 space-y-1">
            <p className="text-sm font-bold">Gundaling Farmstead</p>
            <p className="text-[10px] text-on-surface-variant">Berastagi, North Sumatra</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] text-on-surface-variant mb-4">
            <div>Date</div>
            <div className="text-right">{now.toLocaleDateString()}</div>
            <div>Time</div>
            <div className="text-right">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            <div>Table</div>
            <div className="text-right">{selectedTable}</div>
            <div>Invoice</div>
            <div className="text-right">{invoiceNumber}</div>
          </div>

          <div className="space-y-3 mb-4">
            {activeCart.map((item) => (
              <div key={item.id} className="space-y-1">
                <div className="grid grid-cols-[1.1fr_auto_auto] gap-2 text-[10px] text-on-surface">
                  <span className="truncate font-semibold">{item.name}</span>
                  <span className="text-right">x{item.qty}</span>
                  <span className="text-right font-bold">Rp {Math.floor(item.price * item.qty).toLocaleString('id-ID')}</span>
                </div>
                {item.note ? (
                  <p className="text-[9px] text-on-surface-variant italic">Catatan: {item.note}</p>
                ) : null}
              </div>
            ))}
          </div>

          <div className="space-y-2 border-t border-outline-variant/20 pt-3 text-[10px] text-on-surface-variant">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>Rp {Math.floor(subtotal).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span>Service (10%)</span>
              <span>Rp {Math.floor(serviceCharge).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between pt-3 font-semibold text-on-surface">
              <span>Grand Total</span>
              <span>Rp {Math.floor(grandTotal).toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-surface-container-low p-4 text-center text-[10px] text-on-surface-variant">
            Thank you for your visit.
          </div>
        </div>

        <button
          onClick={onPrint}
          disabled={isPrinting}
          className="mt-4 w-full h-12 rounded-xl bg-primary text-on-primary font-bold text-sm transition hover:bg-primary/90 disabled:opacity-60"
        >
          {isPrinting ? 'Preparing print...' : 'Print Receipt'}
        </button>
      </div>
    </div>
  )
}
