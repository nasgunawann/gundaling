import React, { useState } from 'react'
import { useNotification } from '../components/NotificationProvider'
import useStore from '../store'
import CartDrawer from '../components/CartDrawer'

const CATEGORY_PALETTE = [
  { bg: 'bg-emerald-50', border: 'border-l-emerald-500', text: 'text-emerald-700', catBadge: 'bg-emerald-100 text-emerald-700' },
  { bg: 'bg-amber-50', border: 'border-l-amber-500', text: 'text-amber-700', catBadge: 'bg-amber-100 text-amber-700' },
  { bg: 'bg-violet-50', border: 'border-l-violet-500', text: 'text-violet-700', catBadge: 'bg-violet-100 text-violet-700' },
  { bg: 'bg-orange-50', border: 'border-l-orange-500', text: 'text-orange-700', catBadge: 'bg-orange-100 text-orange-700' },
  { bg: 'bg-cyan-50', border: 'border-l-cyan-500', text: 'text-cyan-700', catBadge: 'bg-cyan-100 text-cyan-700' },
  { bg: 'bg-rose-50', border: 'border-l-rose-500', text: 'text-rose-700', catBadge: 'bg-rose-100 text-rose-700' },
  { bg: 'bg-lime-50', border: 'border-l-lime-500', text: 'text-lime-700', catBadge: 'bg-lime-100 text-lime-700' },
  { bg: 'bg-sky-50', border: 'border-l-sky-500', text: 'text-sky-700', catBadge: 'bg-sky-100 text-sky-700' },
  { bg: 'bg-pink-50', border: 'border-l-pink-500', text: 'text-pink-700', catBadge: 'bg-pink-100 text-pink-700' },
  { bg: 'bg-teal-50', border: 'border-l-teal-500', text: 'text-teal-700', catBadge: 'bg-teal-100 text-teal-700' },
  { bg: 'bg-fuchsia-50', border: 'border-l-fuchsia-500', text: 'text-fuchsia-700', catBadge: 'bg-fuchsia-100 text-fuchsia-700' },
  { bg: 'bg-yellow-50', border: 'border-l-yellow-500', text: 'text-yellow-700', catBadge: 'bg-yellow-100 text-yellow-700' },
  { bg: 'bg-indigo-50', border: 'border-l-indigo-500', text: 'text-indigo-700', catBadge: 'bg-indigo-100 text-indigo-700' },
  { bg: 'bg-red-50', border: 'border-l-red-500', text: 'text-red-700', catBadge: 'bg-red-100 text-red-700' },
  { bg: 'bg-blue-50', border: 'border-l-blue-500', text: 'text-blue-700', catBadge: 'bg-blue-100 text-blue-700' },
]

export default function TableOrderView({ selectedTable, setSelectedTable, products, tableCarts, setTableCarts }) {
  const { showToast, showConfirm, requestManagerApproval } = useNotification()
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
  const storeReservations = useStore((state) => state.reservations || [])
  const storeCategories = useStore((state) => state.categories || [])
  const submitOrderStore = useStore((state) => state.submitOrder)
  const updateOrderStatusStore = useStore((state) => state.updateOrderStatus)
  const updateReservationStore = useStore((state) => state.updateReservation)
  const user = useStore((state) => state.user)

  const tablesList = storeTables && storeTables.length > 0 ? storeTables.map(t => t.name) : []
  const allCategories = ['All', ...storeCategories.map(c => c.name)]

  const getCategoryColor = (catName) => {
    if (!catName) return CATEGORY_PALETTE[0]
    const idx = allCategories.indexOf(catName)
    return CATEGORY_PALETTE[(idx >= 0 ? idx : 0) % CATEGORY_PALETTE.length]
  }

  // Load cart for active table
  const activeCart = tableCarts[selectedTable] || []

  // Add Item to active table's cart (only creates/increments draft items, never mutates sent ones)
  const handleAddToCart = (product) => {
    if (product.outOfStock) return
    setTableCarts(prev => {
      const currentCart = prev[selectedTable] || []
      const existingDraft = currentCart.find(
        item => !item.sent && item.product_id === product.id
      )

      let updatedCart
      if (existingDraft) {
        updatedCart = currentCart.map(item =>
          item.cartItemId === existingDraft.cartItemId
            ? { ...item, qty: item.qty + 1 }
            : item
        )
      } else {
        updatedCart = [
          ...currentCart,
          {
            cartItemId: `draft-${product.id}-${Date.now()}`,
            product_id: product.id,
            name: product.name,
            price: product.price,
            qty: 1,
            sent: false,
            note: '',
          },
        ]
      }

      return { ...prev, [selectedTable]: updatedCart }
    })
  }

  const handleUpdateItemNote = (cartItemId, note) => {
    setTableCarts(prev => {
      const currentCart = prev[selectedTable] || []
      const item = currentCart.find(i => i.cartItemId === cartItemId)
      if (item?.sent) return prev // ignore editing sent items
      const updatedCart = currentCart.map(item =>
        item.cartItemId === cartItemId ? { ...item, note } : item
      )
      return { ...prev, [selectedTable]: updatedCart }
    })
  }

  // Qty Changes (only for unsent items)
  const handleQtyChange = (cartItemId, delta) => {
    setTableCarts(prev => {
      const currentCart = prev[selectedTable] || []
      const item = currentCart.find(i => i.cartItemId === cartItemId)
      if (item?.sent) return prev
      const updatedCart = currentCart.reduce((acc, item) => {
        if (item.cartItemId !== cartItemId) return [...acc, item]
        const newQty = item.qty + delta
        if (newQty <= 0) return acc
        return [...acc, { ...item, qty: newQty }]
      }, [])
      return { ...prev, [selectedTable]: updatedCart }
    })
  }

  // Remove Item (only for unsent items)
  const handleRemoveItem = async (cartItemId) => {
    setTableCarts(prev => {
      const currentCart = prev[selectedTable] || []
      const item = currentCart.find(i => i.cartItemId === cartItemId)
      if (item?.sent) return prev
      const updatedCart = currentCart.filter(i => i.cartItemId !== cartItemId)
      return { ...prev, [selectedTable]: updatedCart }
    })
  }

  // Clear Cart
  const handleClearCart = async () => {
    const hasUnsent = activeCart.some(item => !item.sent)
    if (!hasUnsent) {
      showToast('No unsent draft items to clear.', 'info')
      return
    }

    const confirmed = await showConfirm(
      'Clear Table Cart',
      `Are you sure you want to clear all unsent draft items for ${selectedTable}?`
    )
    if (confirmed) {
      setTableCarts(prev => {
        const currentCart = prev[selectedTable] || []
        const updatedCart = currentCart.filter(item => item.sent)
        return { ...prev, [selectedTable]: updatedCart }
      })
      showToast(`Cleared unsent draft items for ${selectedTable}`, 'info')
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
    const unsentItems = activeCart.filter(item => !item.sent)
    if (unsentItems.length === 0) return
    setIsSendingToKitchen(true)

    try {
      const tableObj = storeTables.find((t) => t.name === selectedTable)
      if (!tableObj) {
        throw new Error(`Table ${selectedTable} not found in database.`)
      }

      const itemsPayload = unsentItems.map(item => ({
        product_id: item.product_id || item.id,
        qty: item.qty,
        sent: true,
        note: item.note || ''
      }))

      await submitOrderStore(tableObj.id, itemsPayload)
      
      // Remove successfully transmitted drafts; DB sync (App.jsx) will repopulate sent items
      setTableCarts(prev => {
        const currentCart = prev[selectedTable] || []
        const sentIds = new Set(unsentItems.map(i => i.cartItemId))
        const updatedCart = currentCart.filter(i => !sentIds.has(i.cartItemId))
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
    const tableObj = storeTables.find((t) => t.name === selectedTable)
    if (!tableObj) return

    const activeOrders = storeOrders.filter(
      (o) => (o.tableId === tableObj.id || o.table_id === tableObj.id) && o.status !== 'paid'
    )

    if (activeOrders.length === 0) {
      showToast('No active orders to settle.', 'info')
      return
    }

    const confirmed = await showConfirm(
      'Confirm Settle Bill',
      `Are you sure you want to settle the bill for ${selectedTable}? This will mark all active orders as paid and clean the table.`
    )
    if (!confirmed) return

    setIsSettling(true)

    try {
      await Promise.all(
        activeOrders.map(order => updateOrderStatusStore(order.id, 'paid'))
      )
      
      // Automatically complete any active seated reservations for this table
      const seatedReservation = (storeReservations || []).find(
        (r) => (r.tableId === tableObj.id || r.table_id === tableObj.id) && r.status === 'Seated'
      )
      if (seatedReservation) {
        await updateReservationStore(seatedReservation.id, 'Completed')
      }
      
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
    
    const catName = product.category?.name || product.category || ''
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.desc && product.desc.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (typeof catName === 'string' && catName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (product.badge && product.badge.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesCat && matchesSearch
  })

  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-background h-full w-full overflow-hidden">

      {/* LEFT: Menu Products Catalog Grid */}
      <div className="flex-1 flex flex-col h-full overflow-hidden lg:border-r border-outline-variant/20">

        {/* Header with Table Selection Selector */}
        <header className="h-20 bg-surface flex justify-between items-center px-container_margin border-b border-outline-variant/10 z-10 font-display shrink-0">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <label className="text-[9px] font-bold text-on-surface-variant/80 uppercase tracking-widest leading-none mb-1">Serving Table</label>
                <div className="relative">
                  <select
                    value={selectedTable}
                    onChange={(e) => setSelectedTable(e.target.value)}
                    className="bg-primary/10 border-none font-bold text-primary px-4 py-2.5 rounded-xl text-base focus:ring-2 focus:ring-primary appearance-none pr-8 cursor-pointer shadow-sm"
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
            </div>
          </div>
        </header>

        {/* Filters Wrapper: Merged Categories and Search Bar into one block */}
        <div className="px-container_margin py-4 border-b border-outline-variant/10 bg-surface-container-lowest/15 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          {/* Category Filters Container */}
          <div className="flex-1 flex items-center gap-2 max-w-full md:max-w-[calc(100%-300px)]">
            
            {/* Scrollable all categories */}
            <div className="relative flex-grow overflow-hidden flex items-center group/nav">
              {/* Left Scroll Button */}
              <button 
                onClick={() => {
                  const container = document.getElementById('category-scroll-container-order');
                  if (container) container.scrollBy({ left: -200, behavior: 'smooth' });
                }}
                className="absolute left-1 z-20 flex items-center justify-center w-7 h-7 rounded-full bg-surface border border-outline-variant/20 shadow-sm text-on-surface-variant opacity-0 group-hover/nav:opacity-100 transition-opacity active:scale-90"
                title="Scroll Left"
              >
                <span className="material-symbols-outlined text-sm font-bold">chevron_left</span>
              </button>

              {/* Left Fade Overlay */}
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none z-10"></div>
              
              <div 
                id="category-scroll-container-order"
                className="flex gap-2 overflow-x-auto scrollbar-none py-1 px-8 w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth items-center"
              >
                {allCategories.map((cat) => (
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

              {/* Right Fade Overlay */}
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10"></div>

              {/* Right Scroll Button */}
              <button 
                onClick={() => {
                  const container = document.getElementById('category-scroll-container-order');
                  if (container) container.scrollBy({ left: 200, behavior: 'smooth' });
                }}
                className="absolute right-1 z-20 flex items-center justify-center w-7 h-7 rounded-full bg-surface border border-outline-variant/20 shadow-sm text-on-surface-variant opacity-0 group-hover/nav:opacity-100 transition-opacity active:scale-90"
                title="Scroll Right"
              >
                <span className="material-symbols-outlined text-sm font-bold">chevron_right</span>
              </button>
            </div>

          </div>

          {/* Search bar with quick clear */}
          <div className="relative w-full md:max-w-[280px] shrink-0">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none">search</span>
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-full py-2.5 pl-11 pr-10 text-xs font-semibold focus:ring-2 focus:ring-primary/20 shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded-full bg-on-surface-variant/20 text-on-surface-variant hover:bg-on-surface-variant/40 active:scale-90 transition-all"
              >
                <span className="material-symbols-outlined text-sm font-bold">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Product Cards Grid - Text-only with color-coded categories */}
        <div className="flex-grow p-container_margin overflow-y-auto custom-scrollbar pb-16 bg-surface-container-lowest/30">
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
            {filteredProducts.length > 0 ? filteredProducts.map((p) => {
              const catName = p.category?.name || p.category || ''
              const colors = getCategoryColor(catName)
              return (
                <div
                  key={p.id}
                  onClick={() => handleAddToCart(p)}
                  className={`rounded-2xl border ${colors.bg} shadow-sm flex flex-col group cursor-pointer active:scale-[0.97] transition-all min-h-[156px] ${
                    p.outOfStock
                      ? 'opacity-50 cursor-not-allowed select-none'
                      : 'hover:shadow-md'
                  }`}
                >
                  <div className="p-4 pb-1 flex flex-col gap-1.5 flex-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${colors.catBadge} leading-none self-start`}>
                      {catName}
                    </span>
                    <h3 className={`text-sm font-bold leading-tight line-clamp-3 ${p.outOfStock ? 'text-on-surface/50' : 'text-on-surface'}`}>
                      {p.name}
                    </h3>
                  </div>
                  <div className="px-4 pb-3 flex items-center justify-between">
                    <span className={`text-sm font-bold font-display ${p.outOfStock ? 'text-on-surface-variant/50 line-through' : 'text-primary'}`}>
                      Rp {Math.floor(p.price).toLocaleString('id-ID')}
                    </span>
                    {p.outOfStock ? (
                      <div className="w-8 h-8 bg-surface-container-high text-on-surface-variant/50 rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-sm font-bold">block</span>
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-primary text-on-primary rounded-xl flex items-center justify-center shadow-sm active:scale-90 transition-all opacity-80 group-hover:opacity-100">
                        <span className="material-symbols-outlined text-sm font-bold">add</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            }) : (
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
        orderNumber={activeCart.find(i => i.sent)?.orderId ? storeOrders.find(o => o.id === activeCart.find(i => i.sent).orderId)?.orderNumber : null}
      />

      {/* Floating Action Button (FAB) for Cart Summary in bottom-right */}
      <button
        onClick={() => setIsCartOpen(!isCartOpen)}
        className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 z-30 h-16 px-6 bg-primary hover:bg-primary-container text-on-primary rounded-full font-bold flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
        title="View Cart Summary"
      >
        <span className="material-symbols-outlined text-2xl font-bold">shopping_cart</span>
        <span className="text-sm font-bold uppercase tracking-wider hidden sm:inline">View Bill</span>
        {activeCart.length > 0 && (
          <span className="w-6 h-6 bg-error text-on-error rounded-full flex items-center justify-center text-xs font-bold shadow-sm border border-primary animate-pulse">
            {activeCart.reduce((totalQty, item) => totalQty + item.qty, 0)}
          </span>
        )}
      </button>
    </div>
  );
}
