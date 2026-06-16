import React, { useState } from 'react'
import { useNotification } from '../components/NotificationProvider'
import ReceiptModal from '../components/ReceiptModal'
import useStore from '../store'

export default function TableOrderView({ selectedTable, setSelectedTable, products, tableCarts, setTableCarts }) {
  const { showToast, showConfirm } = useNotification()
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [isPrinting, setIsPrinting] = useState(false)
  const [isSettling, setIsSettling] = useState(false)
  const [isSendingToKitchen, setIsSendingToKitchen] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [activeNoteItemId, setActiveNoteItemId] = useState(null)

  const storeTables = useStore((state) => state.tables)
  const storeOrders = useStore((state) => state.orders)
  const storeCategories = useStore((state) => state.categories || [])
  const submitOrderStore = useStore((state) => state.submitOrder)
  const updateOrderStatusStore = useStore((state) => state.updateOrderStatus)

  const tablesList = storeTables && storeTables.length > 0 ? storeTables.map(t => t.name) : []
  const categories = ['All', ...storeCategories.map(c => c.name)]

  // Load cart for active table
  const activeCart = tableCarts[selectedTable] || []

  // Add Item to active table's cart
  const handleAddToCart = (product) => {
    if (product.outOfStock) return
    setTableCarts(prev => {
      const currentCart = prev[selectedTable] || []
      const existing = currentCart.find(item => item.id === product.id)

      let updatedCart
      if (existing) {
        updatedCart = currentCart.map(item =>
          item.id === product.id ? { ...item, qty: item.qty + 1, sent: false } : item
        )
      } else {
        updatedCart = [...currentCart, { id: product.id, name: product.name, price: product.price, qty: 1, sent: false, note: '' }]
      }

      return { ...prev, [selectedTable]: updatedCart }
    })
  }

  const handleUpdateItemNote = (itemId, note) => {
    setTableCarts(prev => {
      const currentCart = prev[selectedTable] || []
      const updatedCart = currentCart.map(item =>
        item.id === itemId ? { ...item, note } : item
      )
      return { ...prev, [selectedTable]: updatedCart }
    })
  }

  // Qty Changes
  const handleQtyChange = (itemId, delta) => {
    setTableCarts(prev => {
      const currentCart = prev[selectedTable] || []
      const updatedCart = currentCart.reduce((acc, item) => {
        if (item.id !== itemId) return [...acc, item]
        const newQty = item.qty + delta
        if (newQty <= 0) return acc
        return [...acc, { ...item, qty: newQty, sent: false }]
      }, [])
      return { ...prev, [selectedTable]: updatedCart }
    })
  }

  // Remove Item
  const handleRemoveItem = (itemId) => {
    setTableCarts(prev => {
      const currentCart = prev[selectedTable] || []
      const updatedCart = currentCart.filter(item => item.id !== itemId)
      return { ...prev, [selectedTable]: updatedCart }
    })
  }

  // Clear Cart
  const handleClearCart = async () => {
    const confirmed = await showConfirm(
      'Clear Table Cart',
      `Are you sure you want to clear all items for ${selectedTable}?`
    )
    if (confirmed) {
      setTableCarts(prev => ({ ...prev, [selectedTable]: [] }))
      showToast(`Cleared all items for ${selectedTable}`, 'info')
    }
  }

  // Print Bill Simulation
  const handlePrintBill = () => {
    if (activeCart.length === 0) return
    setShowReceiptModal(true)
  }

  // Trigger browser print dialog for thermal receipt
  const handleTriggerSystemPrint = () => {
    setIsPrinting(true)
    setTimeout(() => {
      window.print()
      setIsPrinting(false)
    }, 500)
  }

  // Send pending items to kitchen
  const handleSendToKitchen = async () => {
    if (activeCart.length === 0) return
    setIsSendingToKitchen(true)

    try {
      const tableObj = storeTables.find((t) => t.name === selectedTable)
      if (!tableObj) {
        throw new Error(`Table ${selectedTable} not found in database.`)
      }

      const itemsPayload = activeCart.map(item => ({
        product_id: item.id,
        qty: item.qty,
        sent: true,
        note: item.note || ''
      }))

      await submitOrderStore(tableObj.id, itemsPayload)
      
      setTableCarts(prev => {
        const currentCart = prev[selectedTable] || []
        const updatedCart = currentCart.map(item => ({ ...item, sent: true }))
        return { ...prev, [selectedTable]: updatedCart }
      })

      showToast(`Order for ${selectedTable} successfully transmitted to kitchen displays!`, 'success')
    } catch (err) {
      console.error(err)
      showToast(err.message || 'Failed to send order to kitchen.', 'error')
    } finally {
      setIsSendingToKitchen(false)
    }
  }

  // Settle Bill
  const handleSettleBill = async () => {
    if (activeCart.length === 0) return
    setIsSettling(true)

    try {
      const tableObj = storeTables.find((t) => t.name === selectedTable)
      const activeOrder = storeOrders.find((o) => o.table_id === tableObj?.id && o.status !== 'paid')
      
      if (!activeOrder) {
        throw new Error('No active order found for this table.')
      }

      await updateOrderStatusStore(activeOrder.id, 'paid')
      
      showToast(`Bill for ${selectedTable} settled! Total of Rp ${Math.floor(grandTotal).toLocaleString('id-ID')} received.`, 'success')
      setTableCarts(prev => ({ ...prev, [selectedTable]: [] }))
    } catch (err) {
      console.error(err)
      showToast(err.message || 'Failed to settle bill.', 'error')
    } finally {
      setIsSettling(false)
    }
  }

  // Calculations
  const subtotal = activeCart.reduce((acc, item) => acc + (item.price * item.qty), 0)
  const serviceCharge = subtotal * 0.1
  const grandTotal = subtotal + serviceCharge

  const hasUnsentItems = activeCart.length > 0 && activeCart.some(item => !item.sent)

  // Filter products catalog
  const filteredProducts = products.filter(product => {
    const matchesCat = activeCategory === 'All' || 
                       (product.category && (product.category.name === activeCategory || product.category === activeCategory))
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.desc && product.desc.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCat && matchesSearch
  })

  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-background h-full w-full overflow-hidden">

      {/* LEFT: Menu Products Catalog Grid */}
      <div className="flex-1 flex flex-col h-full overflow-hidden lg:border-r border-outline-variant/20">

        {/* Header with Table Selection Selector */}
        <header className="h-20 bg-surface/80 backdrop-blur-md flex justify-between items-center px-container_margin border-b border-outline-variant/10 z-10 font-display">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <label className="text-[9px] font-bold text-on-surface-variant/80 uppercase tracking-widest leading-none mb-1">Serving Table</label>
              <div className="relative">
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="bg-primary/10 border-none font-bold text-primary px-4 py-2 rounded-xl text-base focus:ring-2 focus:ring-primary appearance-none pr-8 cursor-pointer shadow-sm"
                >
                  {tablesList.map(t => (
                    <option key={t} value={t} className="text-on-surface bg-surface font-semibold">{t}</option>
                  ))}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-primary">
                  <span className="material-symbols-outlined text-sm">expand_more</span>
                </div>
              </div>
            </div>

            <div className="relative w-full max-w-[320px] ml-0 lg:ml-4">
              <span className="material-symbols-outlined absolute left-4.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">search</span>
              <input
                type="text"
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-full py-2 pl-11 pr-4 text-xs font-semibold focus:ring-2 focus:ring-primary/20 shadow-sm"
              />
            </div>
          </div>
        </header>

        {/* Category horizontal filters */}
        <div className="px-container_margin py-4 flex gap-2 overflow-x-auto custom-scrollbar bg-surface-container-lowest/15">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${activeCategory === cat
                  ? 'bg-primary text-on-primary border-primary shadow-sm'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container border-outline-variant/15'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        <div className="flex-grow p-container_margin overflow-y-auto custom-scrollbar pb-16 bg-surface-container-lowest/30">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-gutter">
            {filteredProducts.length > 0 ? filteredProducts.map((p) => (
              <div
                key={p.id}
                onClick={() => handleAddToCart(p)}
                className={`bg-surface rounded-3xl overflow-hidden border border-outline-variant/35 shadow-[0_4px_12px_rgba(0,0,0,0.02)] transition-all duration-200 flex flex-col justify-between group ${p.outOfStock
                    ? 'opacity-50 cursor-not-allowed select-none'
                    : 'hover:shadow-[0_8px_24px_rgba(0,0,0,0.05)] cursor-pointer active:scale-[0.98]'
                  }`}
              >
                <div>
                  <div className="aspect-[16/10] bg-surface-container-highest relative overflow-hidden">
                    <img
                      alt={p.name}
                      className={`w-full h-full object-cover transition-transform duration-300 ${p.outOfStock ? 'grayscale' : 'group-hover:scale-105'
                        }`}
                      src={p.image}
                    />
                    <span className={`absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest shadow-sm ${p.outOfStock ? 'bg-error text-on-error' : 'bg-primary text-on-primary'
                      }`}>
                      {p.badge}
                    </span>
                  </div>
                  <div className="p-3 pb-2">
                    <h3 className={`font-display font-bold text-xs mb-0.5 leading-snug truncate transition-colors ${p.outOfStock ? 'text-on-surface/60' : 'text-on-surface group-hover:text-primary'
                      }`}>
                      {p.name}
                    </h3>
                    <p className={`text-[10px] line-clamp-1 leading-relaxed ${p.outOfStock ? 'text-on-surface-variant/40' : 'text-on-surface-variant/80'
                      }`}>
                      {p.desc}
                    </p>
                  </div>
                </div>

                <div className="p-3 pt-0 flex justify-between items-center mt-1">
                  <span className={`text-sm font-bold font-display ${p.outOfStock ? 'text-on-surface-variant/50 line-through' : 'text-primary'
                    }`}>
                    Rp {Math.floor(p.price).toLocaleString('id-ID')}
                  </span>

                  {p.outOfStock ? (
                    <div className="w-11 h-11 bg-surface-container-high text-on-surface-variant/50 rounded-xl flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-base font-bold">block</span>
                    </div>
                  ) : (
                    <div className="w-11 h-11 bg-primary/10 text-primary hover:bg-primary hover:text-on-primary rounded-xl transition-all flex items-center justify-center shadow-sm active:scale-90">
                      <span className="material-symbols-outlined text-base font-bold">add</span>
                    </div>
                  )}
                </div>
              </div>
            )) : (
              <div className="col-span-full rounded-3xl border border-dashed border-outline-variant/40 bg-surface-container-low p-10 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[40px] mb-4 inline-block">search_off</span>
                <p className="text-sm font-bold">No matching menu items found</p>
                <p className="text-xs mt-2 leading-relaxed">Try another keyword or category to locate the dish.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: High-density Billing & Cart Summary Side Panel */}
      <div className="w-full lg:w-[420px] bg-surface flex flex-col h-full overflow-hidden shadow-[-4px_0_24px_rgba(0,0,0,0.02)] z-10 mt-6 lg:mt-0">

        {/* Panel Header */}
        <header className="px-6 py-6 border-b border-surface-container flex justify-between items-center bg-surface-container-low/20">
          <div>
            <h3 className="text-base font-bold font-display text-on-surface">Bill & Order Summary</h3>
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-0.5 font-mono">
              Active Session • {selectedTable}
            </p>
          </div>

          {activeCart.length > 0 && (
            <button
              onClick={handleClearCart}
              className="p-2 text-outline hover:text-error hover:bg-error/10 rounded-xl transition-all"
              title="Clear Active Cart"
            >
              <span className="material-symbols-outlined text-lg">delete_sweep</span>
            </button>
          )}
        </header>

        {/* Panel Receipt Content */}
        <div className="flex-grow overflow-y-auto px-6 py-4 custom-scrollbar bg-surface-container-lowest/15 flex flex-col justify-between">

          {/* Cart Items List */}
          {activeCart.length > 0 ? (
            <div className="flex flex-col gap-2">
              {activeCart.map((item) => (
                <div
                  key={item.id}
                  className="bg-surface p-2.5 rounded-xl border border-outline-variant/20 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex justify-between items-center group hover:border-primary/10 transition-all"
                >
                  <div className="flex flex-col gap-1 max-w-[160px]">
                    <h4 className="text-xs font-bold text-on-surface leading-tight truncate group-hover:text-primary transition-colors">
                      {item.name}
                    </h4>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-bold text-primary font-display">Rp {Math.floor(item.price).toLocaleString('id-ID')}</p>
                      {item.sent ? (
                        <span className="inline-flex items-center gap-1 text-[8px] font-bold text-primary uppercase bg-primary-container/20 border border-primary/20 px-1.5 py-0.5 rounded-full select-none">
                          <span className="w-1 h-1 rounded-full bg-primary animate-pulse"></span>Cooking
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[8px] font-bold text-amber-700 uppercase bg-amber-50 border border-amber-200/50 px-1.5 py-0.5 rounded-full select-none">
                          <span className="w-1 h-1 rounded-full bg-amber-500"></span>Pending
                        </span>
                      )}
                    </div>
                    {item.note || activeNoteItemId === item.id ? (
                      <textarea
                        value={item.note || ''}
                        onChange={(e) => handleUpdateItemNote(item.id, e.target.value)}
                        placeholder="Tulis catatan..."
                        className="min-h-[48px] w-full rounded-xl border border-outline-variant/10 bg-surface-container-low px-3 py-2 text-[10px] leading-snug text-on-surface resize-none outline-none focus:border-primary/15 focus:ring-1 focus:ring-primary/15 mt-1"
                        autoFocus={activeNoteItemId === item.id}
                        onBlur={() => {
                          if (!item.note) setActiveNoteItemId(null);
                        }}
                      />
                    ) : (
                      <button
                        onClick={() => setActiveNoteItemId(item.id)}
                        className="text-[10px] font-bold text-primary hover:opacity-85 flex items-center gap-1 mt-1 text-left"
                      >
                        <span className="material-symbols-outlined text-[14px]">edit_note</span>
                        Tambah Catatan
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Qty selectors */}
                    <div className="flex items-center bg-surface-container rounded-xl border border-outline-variant/25 p-0.5">
                      <button
                        onClick={() => handleQtyChange(item.id, -1)}
                        className="w-11 h-11 rounded-lg hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant font-bold active:scale-90 transition-all"
                      >
                        <span className="material-symbols-outlined text-sm font-bold">remove</span>
                      </button>
                      <span className="w-8 text-center text-xs font-bold font-mono text-on-surface">{item.qty}</span>
                      <button
                        onClick={() => handleQtyChange(item.id, 1)}
                        className="w-11 h-11 rounded-lg hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant font-bold active:scale-90 transition-all"
                      >
                        <span className="material-symbols-outlined text-sm font-bold">add</span>
                      </button>
                    </div>

                    {/* Trash */}
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="w-11 h-11 hover:bg-error/10 text-outline-variant hover:text-error rounded-xl transition-all flex items-center justify-center"
                      title="Remove Item"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
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
    </div>
  );
}
