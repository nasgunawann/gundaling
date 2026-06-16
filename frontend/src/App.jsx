import React, { useState } from 'react'
import Sidebar from './components/Sidebar'
import WaiterLogin from './views/WaiterLogin'
import FloorPlan from './views/FloorPlan'
import TableOrderView from './views/TableOrderView'
import ProductEnrichment from './views/ProductEnrichment'
import Reservations from './views/Reservations'

export default function App() {
  const [user, setUser] = useState(null) // { name: 'Andi Pratama', role: 'Server' }
  const [currentView, setCurrentView] = useState('floor-plan') // 'floor-plan', 'table-menu', 'product-enrichment', 'reservations'
  const [selectedTable, setSelectedTable] = useState('Table 12') // Default active table
  
  // Master Products Catalog State (Shared across Ordering and Management)
  const [products, setProducts] = useState([
    {
      id: 'item_1',
      name: 'Truffle Tagliatelle',
      price: 260000,
      category: 'Meals',
      image: '/images/truffle_tagliatelle.png',
      desc: 'Handmade pasta tossed in premium shaved black truffle butter, finished with freshly grated dry-aged Parmigiano.',
      badge: 'Best Seller',
      details: { temp: 'HOT', time: '12 min', calories: '640 kcal' },
      standards: { organicCert: true, tempControlled: true, allergenWarning: false, garnishAdded: true }
    },
    {
      id: 'item_2',
      name: 'Crispy Skin Salmon',
      price: 285000,
      category: 'Meals',
      image: '/images/crispy_skin_salmon.png',
      desc: 'Pan-seared Atlantic salmon on a bed of fresh garlic butter asparagus and creamy mashed mountain potatoes.',
      badge: 'Signature',
      details: { temp: 'HOT', time: '15 min', calories: '580 kcal' },
      standards: { organicCert: true, tempControlled: true, allergenWarning: false, garnishAdded: false }
    },
    {
      id: 'item_3',
      name: 'Heirloom Tomato Salad',
      price: 160000,
      category: 'Meals',
      image: '/images/heirloom_tomato_salad.png',
      desc: 'Fresh heirloom garden tomatoes, artisan buffalo mozzarella, farm basil, drizzled in premium aged balsamic vinegar.',
      badge: 'Vegan',
      details: { temp: 'COLD', time: '5 min', calories: '220 kcal' },
      standards: { organicCert: true, tempControlled: false, allergenWarning: false, garnishAdded: true }
    },
    {
      id: 'item_milk_1',
      name: 'Fresh Gundaling Cow Milk',
      price: 65000,
      category: 'Milk & Dairy',
      image: '/images/gundaling_milk.png',
      desc: 'Organic raw milk harvested daily from our high-altitude Berastagi dairy farm, pasteurized and flash chilled.',
      badge: 'Farmstead Fresh',
      details: { temp: 'COLD', time: '1 min', calories: '150 kcal' },
      standards: { organicCert: true, tempControlled: true, allergenWarning: false, garnishAdded: false }
    },
    {
      id: 'item_coffee_1',
      name: 'Single Origin Latte',
      price: 55000,
      category: 'Coffee',
      image: '/images/single_origin_latte.png',
      desc: 'Premium espresso pulled from organic Sumatra Mandheling beans, combined with steamed Gundaling farm milk.',
      badge: 'Artisan',
      details: { temp: 'HOT', time: '3 min', calories: '120 kcal' },
      standards: { organicCert: false, tempControlled: true, allergenWarning: false, garnishAdded: true }
    },
    {
      id: 'item_dessert_1',
      name: 'Organic Strawberry Gelato',
      price: 85000,
      category: 'Desserts',
      image: '/images/strawberry_gelato.png',
      desc: 'High-altitude organic strawberries churned with fresh Gundaling farm pasteurized cow milk cream.',
      badge: 'Sold Out',
      outOfStock: true,
      details: { temp: 'COLD', time: '2 min', calories: '180 kcal' },
      standards: { organicCert: true, tempControlled: true, allergenWarning: false, garnishAdded: true }
    }
  ])

  // Table-Specific Carts State to decouple billing
  const [tableCarts, setTableCarts] = useState({
    'Table 12': [
      { id: 'item_1', name: 'Truffle Tagliatelle', price: 260000, qty: 2, sent: true },
      { id: 'item_2', name: 'Crispy Skin Salmon', price: 285000, qty: 1, sent: true },
      { id: 'item_3', name: 'Heirloom Tomato Salad', price: 160000, qty: 1, sent: true }
    ],
    'Table 04': [
      { id: 'item_3', name: 'Heirloom Tomato Salad', price: 160000, qty: 1, sent: true },
      { id: 'item_coffee_1', name: 'Single Origin Latte', price: 55000, qty: 2, sent: true }
    ],
    'Table 03': [
      { id: 'item_2', name: 'Crispy Skin Salmon', price: 285000, qty: 2, sent: true },
      { id: 'item_1', name: 'Truffle Tagliatelle', price: 260000, qty: 1, sent: true }
    ],
    'Table 08': [
      { id: 'item_1', name: 'Truffle Tagliatelle', price: 260000, qty: 4, sent: true },
      { id: 'item_coffee_1', name: 'Single Origin Latte', price: 55000, qty: 4, sent: true }
    ]
  })

  // Shared Reservations State
  const [reservations, setReservations] = useState([
    { id: 'res_1', name: 'Eleanor Vance', time: '18:30', guests: 4, table: 'T-12', status: 'Seated', phone: '+62 811-2345-6789' },
    { id: 'res_2', name: 'Albert Cole', time: '19:00', guests: 2, table: 'T-05', status: 'Confirmed', phone: '+62 812-9876-5432' },
    { id: 'res_3', name: 'Miriam Sterling', time: '19:30', guests: 6, table: 'T-08', status: 'Confirmed', phone: '+62 813-4567-8901' },
    { id: 'res_4', name: 'Dr. Gregory House', time: '20:00', guests: 1, table: 'Bar-03', status: 'Arrived', phone: '+62 814-1111-2222' }
  ])

  const handleLogout = () => {
    setUser(null)
    setCurrentView('floor-plan')
    setIsOrderDrawerOpen(false)
  }

  // Render Authentication View
  if (!user) {
    return <WaiterLogin onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} />
  }

  return (
    <div className="flex min-h-screen bg-background text-on-surface select-none font-body">
      {/* Sidebar Navigation */}
      <Sidebar 
        currentView={currentView} 
        onViewChange={(view) => setCurrentView(view)} 
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Panel */}
      <div className="flex-1 md:ml-[280px] ml-0 h-screen overflow-hidden flex flex-col">
        {/* Render Active View */}
        {currentView === 'floor-plan' && (
          <FloorPlan 
            onTableClick={(tableName) => {
              setSelectedTable(tableName)
              setCurrentView('table-menu') // Switch directly to table ordering & menu view!
            }} 
            user={user}
            tableCarts={tableCarts}
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
              setProducts={setProducts}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-surface select-none">
              <div className="w-20 h-20 bg-error/10 text-error rounded-3xl flex items-center justify-center mb-6 border border-error/20 shadow-sm animate-pulse">
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
            setReservations={setReservations}
          />
        )}
      </div>
    </div>
  )
}
