import React from 'react'

export default function Sidebar({ currentView, onViewChange, user, onLogout }) {
  const isManager = user?.role === 'Manager'

  const menuItems = [
    { id: 'floor-plan', label: 'Floor Plan', icon: 'layers' },
    { id: 'table-menu', label: 'Table Menu', icon: 'restaurant_menu' },
    ...(isManager ? [{ id: 'product-enrichment', label: 'Product Management', icon: 'inventory_2' }] : []),
    { id: 'reservations', label: 'Reservations', icon: 'event_seat' },
  ]

  return (
    <aside className="relative md:fixed md:left-0 md:top-0 h-auto md:h-full w-full md:w-[280px] bg-surface-container-low md:border-r border-outline-variant/30 flex flex-col z-50 font-display">
      {/* Branding */}
      <div className="px-8 py-8">
        <h1 className="font-display text-primary leading-tight font-bold text-[32px] tracking-tight">
          Gundaling
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-grow flex flex-col gap-1 mt-4 px-2">
        {menuItems.map((item) => {
          const isActive = currentView === item.id
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex items-center gap-3 w-full text-left transition-all rounded-full px-4 py-3 font-semibold ${isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
            >
              <span
                className="material-symbols-outlined"
                style={isActive ? { fontVariationSettings: '"FILL" 1' } : {}}
              >
                {item.icon}
              </span>
              <span className="text-sm font-semibold">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="mt-auto pb-8 flex flex-col gap-1">

        {/* User Card */}
        <div className="px-4 py-3 mx-2 bg-surface-container rounded-2xl flex items-center justify-between border border-outline-variant/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold text-sm shadow-sm border border-outline-variant/10">
              {user.name.charAt(0)}
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface leading-snug">{user.name}</p>
              <p className="text-[10px] font-semibold text-on-surface-variant/80 uppercase tracking-wider">{user.role}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Log Out Staff"
            className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-full transition-all"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
