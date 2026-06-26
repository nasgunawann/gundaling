import React, { useState } from 'react'
import { useNotification } from '../components/NotificationProvider'
import useStore from '../store'
import CartDrawer from '../components/CartDrawer'

export default function TableOrderView({ selectedTable, setSelectedTable, products, tableCarts, setTableCarts }) {
  const { showToast, showConfirm } = useNotification()
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [isPrinting, setIsPrinting] = useState(false)
  const [isSettling, setIsSettling] = useState(false)
  const [isSendingToKitchen, setIsSendingToKitchen] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [activeNoteItemId, setActiveNoteItemId] = useState(null)
  const [isCartOpen, setIsCartOpen] = useState(false)

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
    // Auto-open cart summary drawer on mobile when adding items so the waiter gets immediate feedback
    setIsCartOpen(true)
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
      const activeOrder = storeOrders.find((o) => (o.tableId === tableObj?.id || o.table_id === tableObj?.id) && o.status !== 'paid')
      
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
          <div className="flex items-center justify-between w-full">
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

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCartOpen(!isCartOpen)}
                className="relative h-12 px-5 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all text-xs uppercase tracking-wider"
              >
                <span className="material-symbols-outlined text-base">shopping_cart</span>
                <span>Cart Summary</span>
                {activeCart.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-error text-on-error rounded-full flex items-center justify-center text-[9px] font-bold border border-surface">
                    {activeCart.reduce((totalQty, item) => totalQty + item.qty, 0)}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Category horizontal filters */}
        <div className="px-container_margin py-5 flex items-center gap-2 overflow-x-auto custom-scrollbar bg-surface-container-lowest/15">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border shrink-0 ${activeCategory === cat
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

      <CartDrawer
        isCartOpen={isCartOpen}
        setIsCartOpen={setIsCartOpen}
        selectedTable={selectedTable}
        activeCart={activeCart}
        handleClearCart={handleClearCart}
        handleUpdateItemNote={handleUpdateItemNote}
        activeNoteItemId={activeNoteItemId}
        setActiveNoteItemId={setActiveNoteItemId}
        handleQtyChange={handleQtyChange}
        handleRemoveItem={handleRemoveItem}
        subtotal={subtotal}
        serviceCharge={serviceCharge}
        grandTotal={grandTotal}
        handlePrintBill={handlePrintBill}
        handleSendToKitchen={handleSendToKitchen}
        handleSettleBill={handleSettleBill}
        hasUnsentItems={hasUnsentItems}
        isPrinting={isPrinting}
        isSettling={isSettling}
        isSendingToKitchen={isSendingToKitchen}
        showReceiptModal={showReceiptModal}
        setShowReceiptModal={setShowReceiptModal}
        handleTriggerSystemPrint={handleTriggerSystemPrint}
      />
    </div>
  );
}
