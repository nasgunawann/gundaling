import React from 'react'
import WebsocketStatus from './WebsocketStatus'

export default function Sidebar({ currentView, onViewChange, user, onLogout, isCollapsed, onToggleCollapse }) {
  const isManager = user?.role === 'Manager'
  const isChefOrManager = user?.role === 'Chef' || user?.role === 'Manager'

  const menuItems = [
    { id: 'floor-plan', label: 'Floor Plan', icon: 'layers' },
    { id: 'table-menu', label: 'Table Menu', icon: 'restaurant_menu' },
    ...(isChefOrManager ? [{ id: 'kitchen-queue', label: 'Kitchen KDS', icon: 'soup_kitchen' }] : []),
    ...(isManager ? [{ id: 'product-enrichment', label: 'Product Management', icon: 'inventory_2' }] : []),
    { id: 'reservations', label: 'Reservations', icon: 'event_seat' },
  ]

  return (
    <aside className={`relative md:fixed md:left-0 md:top-0 h-auto md:h-full bg-surface-container-low md:border-r border-outline-variant/30 flex flex-col z-50 font-display transition-all duration-300 ${
      isCollapsed ? 'w-full md:w-[80px]' : 'w-full md:w-[280px]'
    }`}>
      {/* Branding */}
      <div className={`px-4 py-6 flex flex-col items-center justify-center border-b border-outline-variant/10 mb-2 relative`}>
        {!isCollapsed ? (
          <div className="w-full flex flex-col items-center justify-center gap-4">
            <div className="h-20 flex items-center justify-center">
              <img src="/logo.png" alt="Gundaling Logo" className="h-full w-auto object-contain" />
            </div>
            <button 
              onClick={onToggleCollapse}
              className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex items-center justify-center w-8 h-8 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-on-primary transition-all duration-200 border border-primary/20 shadow-sm active:scale-95 touch-manipulation focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              title="Collapse Sidebar"
              aria-label="Collapse Sidebar"
              aria-expanded="true"
            >
              <span className="material-symbols-outlined text-base font-bold">
                chevron_left
              </span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 flex items-center justify-center">
              <img src="/logo.png" alt="Gundaling Logo" className="h-full w-auto object-contain" />
            </div>
            <button 
              onClick={onToggleCollapse}
              className="hidden md:flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-on-primary transition-all duration-200 border border-primary/20 shadow-sm active:scale-95 touch-manipulation focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              title="Expand Sidebar"
              aria-label="Expand Sidebar"
              aria-expanded="false"
            >
              <span className="material-symbols-outlined text-base font-bold">
                chevron_right
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-grow flex flex-col gap-1 mt-4 px-2" aria-label="Main Navigation">
        {menuItems.map((item) => {
          const isActive = currentView === item.id
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex items-center gap-3 transition-all rounded-full font-semibold touch-manipulation focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                isCollapsed ? 'justify-center w-12 h-12 mx-auto' : 'w-full px-4 py-3 text-left'
              } ${isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              title={isCollapsed ? item.label : undefined}
              aria-label={isCollapsed ? item.label : undefined}
              aria-current={isActive ? 'page' : undefined}
            >
              <span
                className="material-symbols-outlined"
                style={isActive ? { fontVariationSettings: '"FILL" 1' } : {}}
              >
                {item.icon}
              </span>
              {!isCollapsed && <span className="text-sm font-semibold">{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="mt-auto pb-8 flex flex-col gap-1">
        <div className={`px-6 mb-4 flex ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
          <WebsocketStatus showLabel={!isCollapsed} />
        </div>

        {/* User Card */}
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2 mx-2">
            <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold text-sm shadow-sm border border-outline-variant/10">
              {user.name.charAt(0)}
            </div>
            <button
              onClick={onLogout}
              title="Log Out Staff"
              aria-label="Log Out Staff"
              className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-full transition-all touch-manipulation focus-visible:ring-2 focus-visible:ring-error focus-visible:outline-none"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        ) : (
          <div className="px-4 py-3 mx-2 bg-surface-container rounded-2xl flex items-center justify-between border border-outline-variant/20">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold text-sm shadow-sm border border-outline-variant/10 shrink-0">
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-on-surface leading-snug truncate" title={user.name}>{user.name}</p>
                <p className="text-[10px] font-semibold text-on-surface-variant/80 uppercase tracking-wider truncate">{user.role}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Log Out Staff"
              aria-label="Log Out Staff"
              className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-full transition-all shrink-0 touch-manipulation focus-visible:ring-2 focus-visible:ring-error focus-visible:outline-none"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
