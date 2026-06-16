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
  const { showToast } = useNotification()
  const [currentView, setCurrentView] = useState(() => localStorage.getItem('gundaling_current_view') || 'floor-plan')
  const [selectedTable, setSelectedTable] = useState(() => localStorage.getItem('gundaling_selected_table') || 'Table 12')
  const [tableCarts, setTableCarts] = useState({})

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
    const newCarts = {}
    orders.forEach((order) => {
      if (order.status !== 'paid' && order.table) {
        newCarts[order.table.name] = order.items.map((item) => ({
          id: item.product_id,
          name: item.product?.name,
          price: Number(item.unit_price),
          qty: item.qty,
          sent: item.sent,
          note: item.note || '',
        }))
      }
    })
    setTableCarts(newCarts)
  }, [orders])

  const handleLogout = async () => {
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
      />

      <div className="flex-1 md:ml-[280px] ml-0 h-screen overflow-hidden flex flex-col">
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
          />
        )}
        {currentView === 'kitchen-queue' && (
          <KitchenDisplay />
        )}
      </div>
    </div>
  )
}
