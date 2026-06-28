import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import WaiterLogin from './views/WaiterLogin'
import FloorPlan from './views/FloorPlan'
import TableOrderView from './views/TableOrderView'
import ProductEnrichment from './views/ProductEnrichment'
import Reservations from './views/Reservations'
import KitchenDisplay from './views/KitchenDisplay'
import useStore from './store'
import { useNotification } from './components/NotificationProvider'

export default function App() {
  const { showToast, showConfirm } = useNotification()
  const [currentView, setCurrentView] = useState(() => localStorage.getItem('gundaling_current_view') || 'floor-plan')
  const [selectedTable, setSelectedTable] = useState(() => localStorage.getItem('gundaling_selected_table') || 'Table 12')
  const [tableCarts, setTableCarts] = useState({})
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem('gundaling_sidebar_collapsed') === 'true')

  const user = useStore((state) => state.user)
  const products = useStore((state) => state.products)
  const tables = useStore((state) => state.tables)
  const orders = useStore((state) => state.orders)
  const reservations = useStore((state) => state.reservations)
  const logoutStore = useStore((state) => state.logout)
  const tryAutoLogin = useStore((state) => state.tryAutoLogin)

  useEffect(() => {
    localStorage.setItem('gundaling_current_view', currentView)
  }, [currentView])

  useEffect(() => {
    localStorage.setItem('gundaling_selected_table', selectedTable)
  }, [selectedTable])

  useEffect(() => {
    localStorage.setItem('gundaling_sidebar_collapsed', isSidebarCollapsed)
  }, [isSidebarCollapsed])

  // Attach showToast to window for Zustand websocket access
  useEffect(() => {
    window.showToast = showToast
    return () => {
      window.showToast = null
    }
  }, [showToast])

  // Try auto-login on mount
  useEffect(() => {
    tryAutoLogin()
  }, [])

  // Sync database orders into local table carts
  useEffect(() => {
    setTableCarts((prevCarts) => {
      const newCarts = { ...prevCarts }
      
      // Preserve only unsent draft items for each table cart
      Object.keys(newCarts).forEach((tableName) => {
        newCarts[tableName] = newCarts[tableName].filter((item) => !item.sent)
      })

      // Aggregate all items from active database orders (status !== paid)
      orders.forEach((order) => {
        if (order.status !== 'paid' && order.table) {
          const tableName = order.table.name
          if (!newCarts[tableName]) {
            newCarts[tableName] = []
          }

          const dbItems = order.items.map((item) => ({
            cartItemId: `sent-${item.id}`,
            product_id: item.product_id || item.productId,
            name: item.product?.name,
            price: Number(item.unitPrice || item.unit_price),
            qty: item.qty,
            sent: true,
            note: item.note || '',
            status: order.status,
            orderId: order.id,
          }))

          newCarts[tableName] = [...newCarts[tableName], ...dbItems]
        }
      })

      return newCarts
    })
  }, [orders])

  const handleLogout = async () => {
    const confirmed = await showConfirm(
      'Log Out Staff',
      'Are you sure you want to end your active shifts and log out of the POS system?'
    )
    if (!confirmed) return

    await logoutStore()
    localStorage.removeItem('gundaling_current_view')
    localStorage.removeItem('gundaling_selected_table')
    setCurrentView('floor-plan')
  }

  if (!user) {
    return <WaiterLogin onLoginSuccess={() => setCurrentView('floor-plan')} />
  }

  return (
    <div className="flex min-h-screen bg-background text-on-surface select-none font-body">
      <Sidebar 
        currentView={currentView} 
        onViewChange={(view) => setCurrentView(view)} 
        user={user}
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className={`flex-1 ${isSidebarCollapsed ? 'md:ml-[80px]' : 'md:ml-[280px]'} ml-0 h-screen overflow-hidden flex flex-col`}>
        {currentView === 'floor-plan' && (
          <FloorPlan 
            onTableClick={(tableName) => {
              setSelectedTable(tableName)
              setCurrentView('table-menu')
            }} 
            user={user}
            tableCarts={tableCarts}
            tables={tables}
          />
        )}
        {currentView === 'table-menu' && (
          <TableOrderView 
            selectedTable={selectedTable}
            setSelectedTable={setSelectedTable}
            products={products}
            tableCarts={tableCarts}
            setTableCarts={setTableCarts}
          />
        )}
        {currentView === 'product-enrichment' && (
          user?.role === 'Manager' ? (
            <ProductEnrichment 
              products={products}
              setProducts={() => {}}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-surface select-none">
              <div className="w-20 h-20 bg-error/10 text-error rounded-3xl flex items-center justify-center mb-6 border border-error/20 shadow-sm">
                <span className="material-symbols-outlined text-[40px]">gavel</span>
              </div>
              <h2 className="text-xl font-bold font-display text-on-surface mb-2">Access Restrained</h2>
              <p className="text-xs text-on-surface-variant max-w-sm leading-relaxed px-4">
                You are currently logged in as a <strong>{user?.role}</strong>. Only staff members with registered <strong>Manager</strong> credentials are authorized to access the master recipe and product enrichment systems.
              </p>
              <button 
                onClick={() => setCurrentView('floor-plan')}
                className="mt-8 px-6 py-3 bg-primary text-on-primary rounded-xl font-bold shadow-md hover:shadow-lg active:scale-95 transition-all text-xs uppercase tracking-wider"
              >
                Return to Floor Plan
              </button>
            </div>
          )
        )}
        {currentView === 'reservations' && (
          <Reservations 
            reservations={reservations} 
            setReservations={() => {}}
            onSeatGuest={(tableName) => {
              setSelectedTable(tableName)
              setCurrentView('table-menu')
            }}
          />
        )}
        {currentView === 'kitchen-queue' && (
          <KitchenDisplay setIsSidebarCollapsed={setIsSidebarCollapsed} />
        )}
      </div>
    </div>
  )
}
