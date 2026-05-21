import React from 'react'

export default function FloorPlan({ onTableClick, user, tableCarts }) {
  // Master base configuration for tables
  const baseTables = [
    { id: 'T-01', name: 'Table 01', seats: 4, type: 'circle', defaultStatus: 'Available' },
    { id: 'T-02', name: 'Table 02', seats: 2, type: 'square', defaultStatus: 'Reserved' },
    { id: 'T-03', name: 'Table 03', seats: 4, type: 'square', defaultStatus: 'Occupied' },
    { id: 'T-04', name: 'Table 04', seats: 4, type: 'square', defaultStatus: 'Occupied' },
    { id: 'T-05', name: 'Table 05', seats: 6, type: 'rectangle', defaultStatus: 'Available' },
    { id: 'T-06', name: 'Table 06', seats: 2, type: 'circle', defaultStatus: 'Available' },
    { id: 'T-07', name: 'Table 07', seats: 8, type: 'rectangle', defaultStatus: 'Reserved' },
    { id: 'T-08', name: 'Table 08', seats: 6, type: 'rectangle', defaultStatus: 'Occupied' },
    { id: 'T-12', name: 'Table 12', seats: 4, type: 'circle', defaultStatus: 'Occupied', highlight: true }
  ]

  // Calculate live dynamic statuses and bill totals from master tableCarts!
  const tables = baseTables.map(t => {
    const cart = tableCarts[t.name] || []
    const hasItems = cart.length > 0

    let status = t.defaultStatus
    let billTotal = 0

    if (hasItems) {
      const hasUnsent = cart.some(item => !item.sent)
      status = hasUnsent ? 'Pending Kitchen' : 'Occupied'
      billTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0) * 1.1 // Including 10% service charge
    } else if (status.startsWith('Occupied') || status === 'Pending' || status === 'Pending Kitchen') {
      // If default was occupied but cart is empty, make it available
      status = 'Available'
    }

    return {
      ...t,
      status,
      bill: billTotal
    }
  })

  const getStatusColor = (status) => {
    if (status.startsWith('Occupied')) return 'bg-primary border-primary text-on-primary'
    if (status === 'Pending Kitchen') return 'bg-tertiary border-tertiary text-on-tertiary animate-pulse'
    if (status === 'Reserved') return 'bg-secondary border-secondary text-on-secondary'
    return 'bg-surface-container-low border-outline-variant/35 text-on-surface'
  }

  const getBadgeStyle = (status) => {
    if (status.startsWith('Occupied') || status === 'Pending Kitchen' || status === 'Reserved') {
      return 'bg-white/20 text-white border-transparent'
    }
    return 'bg-surface border-outline-variant/10 text-on-surface-variant'
  }

  return (
    <div className="flex-1 flex flex-col bg-background h-full w-full overflow-hidden">
      {/* Top Header */}
      <header className="h-20 bg-surface/80 backdrop-blur-md flex justify-between items-center px-container_margin border-b border-outline-variant/10 z-10 font-display">
        <div>
          <h2 className="text-xl font-bold text-on-surface leading-tight">Table Management</h2>
          <p className="text-xs text-on-surface-variant/80 uppercase tracking-widest mt-0.5">Floor Plan • Main Dining Room</p>
        </div>
      </header>

      {/* Main Floor Area */}
      <div className="flex-1 p-container_margin overflow-y-auto custom-scrollbar bg-surface-container-lowest/40 flex flex-col gap-6">

        {/* Status Indicators bar */}
        <div className="flex gap-6 py-3 px-6 bg-surface border border-outline-variant/20 rounded-2xl w-fit shadow-sm text-xs font-bold uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-outline-variant"></div>
            <span className="text-on-surface-variant">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-tertiary animate-pulse"></div>
            <span className="text-tertiary">Pending Kitchen</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <span className="text-primary">Occupied</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-secondary"></div>
            <span className="text-secondary">Reserved</span>
          </div>
        </div> {/* Tables Grid Layout */}
        <div className="flex-grow grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-gutter items-stretch pb-10">
          {
            tables.map((table) => {
              return (
                <button
                  key={table.id}
                  onClick={() => onTableClick(table.name)}
                  className={`relative border rounded-2xl p-4 transition-all duration-200 text-left flex flex-col justify-between group shadow-sm hover:shadow-md active:scale-[0.98] ${table.highlight ? 'ring-2 ring-primary ring-offset-2' : ''
                    } ${getStatusColor(table.status)}`}
                >
                  {/* Header Row */}
                  <div className="flex justify-between items-center w-full">
                    <h3 className="text-xs font-bold font-display group-hover:opacity-90 transition-opacity leading-none text-current">
                      {table.name}
                    </h3>
                    <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm border leading-none ${getBadgeStyle(table.status)}`}>
                      {table.status}
                    </span>
                  </div>

                  {/* Capacity Row */}
                  <div className="mt-2 text-[10px] font-semibold opacity-80 text-current">
                    {table.seats} Seats
                  </div>

                  {/* Billing or Settle info (if Occupied) */}
                  <div className="mt-3 pt-2.5 border-t border-current/20 flex justify-between items-center w-full">
                    {table.bill > 0 ? (
                      <div className="flex justify-between items-center w-full">
                        <span className="text-[8px] font-bold opacity-80 uppercase tracking-wider text-current">
                          Active Bill:
                        </span>
                        <span className="text-xs font-bold font-display font-mono leading-none text-current">
                          Rp {Math.floor(table.bill).toLocaleString('id-ID')}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[8px] font-bold opacity-80 uppercase tracking-wider text-current">
                        {table.status === 'Reserved' ? 'Reserved' : 'Ready'}
                      </span>
                    )}
                  </div>
                </button>
              )
            })
          }
        </div>
      </div>
    </div>
  )
}
