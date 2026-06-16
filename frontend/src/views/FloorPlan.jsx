import React, { useState, useEffect, useRef } from 'react';
import useStore from '../store';
import { useNotification } from '../components/NotificationProvider';
import api from '../api';
import WebsocketStatus from '../components/WebsocketStatus';

export default function FloorPlan({ onTableClick, user, tableCarts, tables: backendTables }) {
  const { showToast, showConfirm } = useNotification();
  const containerRef = useRef(null);

  const updateTablePosition = useStore((state) => state.updateTablePosition);
  const fetchInitialData = useStore((state) => state.fetchInitialData);
  const loading = useStore((state) => state.loading);
  const orders = useStore((state) => state.orders);

  const [isEditMode, setIsEditMode] = useState(false);
  const [localTables, setLocalTables] = useState([]);
  
  // Create table modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableSeats, setNewTableSeats] = useState(4);
  const [newTableShape, setNewTableShape] = useState('square');

  const isLoading = loading && (!backendTables || backendTables.length === 0);
  const rawTables = backendTables && backendTables.length > 0 ? backendTables : [];

  // Process live dynamic status based on orders
  const tables = rawTables.map(t => {
    const activeOrder = orders.find(o => o.table_id === t.id && o.status !== 'paid');
    
    let status = 'Available';
    let billTotal = 0;

    if (activeOrder) {
      billTotal = Number(activeOrder.total);
      if (['pending', 'preparing', 'ready'].includes(activeOrder.status)) {
        status = 'Dining';
      } else if (activeOrder.status === 'served') {
        status = 'Billed';
      }
    } else {
      status = t.status === 'Reserved' ? 'Reserved' : 'Available';
    }

    return {
      ...t,
      status,
      bill: billTotal
    };
  });

  // Keep local tables in sync with database unless actively dragging
  useEffect(() => {
    setLocalTables(tables);
  }, [backendTables, orders]);

  const handleDragStart = (e, table) => {
    if (!isEditMode) return;
    if (e.cancelable) e.preventDefault();
    
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const isTouch = e.type === 'touchstart';

    const getCoordinates = (evt) => {
      const clientX = isTouch ? evt.touches[0].clientX : evt.clientX;
      const clientY = isTouch ? evt.touches[0].clientY : evt.clientY;
      return { clientX, clientY };
    };

    const handleDragMove = (moveEvent) => {
      const { clientX, clientY } = getCoordinates(moveEvent);
      let x = ((clientX - rect.left) / rect.width) * 100;
      let y = ((clientY - rect.top) / rect.height) * 100;

      x = Math.max(1, Math.min(88, x));
      y = Math.max(1, Math.min(85, y));

      setLocalTables(prev => 
        prev.map(t => t.id === table.id ? { ...t, pos_x: parseFloat(x.toFixed(2)), pos_y: parseFloat(y.toFixed(2)) } : t)
      );
    };

    const handleDragEnd = async () => {
      if (isTouch) {
        document.removeEventListener('touchmove', handleDragMove);
        document.removeEventListener('touchend', handleDragEnd);
      } else {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
      }

      const dragTarget = localTables.find(t => t.id === table.id);
      if (dragTarget) {
        await updateTablePosition(table.id, dragTarget.pos_x, dragTarget.pos_y);
      }
    };

    if (isTouch) {
      document.addEventListener('touchmove', handleDragMove, { passive: false });
      document.addEventListener('touchend', handleDragEnd);
    } else {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
    }
  };

  const handleAddTableSubmit = async (e) => {
    e.preventDefault();
    if (!newTableName.trim()) {
      showToast('Please specify a table name.', 'error');
      return;
    }

    try {
      await api.post('/api/tables', {
        name: newTableName,
        seats: parseInt(newTableSeats),
        shape: newTableShape,
        pos_x: 45.00,
        pos_y: 40.00,
        status: 'Available'
      });

      showToast(`Table "${newTableName}" created successfully!`, 'success');
      setShowAddModal(false);
      setNewTableName('');
      await fetchInitialData();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to create table.', 'error');
    }
  };

  const handleDeleteTable = async (table, e) => {
    e.stopPropagation();
    const confirmed = await showConfirm(
      'Delete Table',
      `Are you sure you want to remove "${table.name}" from the floor plan?`
    );

    if (confirmed) {
      try {
        await api.delete(`/api/tables/${table.id}`);
        showToast(`Table "${table.name}" deleted successfully.`, 'success');
        await fetchInitialData();
      } catch (err) {
        console.error(err);
        showToast('Failed to delete table.', 'error');
      }
    }
  };

  const getStatusColor = (status) => {
    if (status === 'Dining') return 'bg-status-occupied border-status-occupied text-status-on-occupied';
    if (status === 'Billed') return 'bg-status-warning border-status-warning text-status-on-warning';
    if (status === 'Reserved') return 'bg-status-reserved border-status-reserved text-status-on-reserved';
    return 'bg-surface border-outline-variant/35 text-on-surface';
  };

  const getBadgeStyle = (status) => {
    if (status.startsWith('Occupied') || status === 'Pending Kitchen' || status === 'Reserved') {
      return 'bg-white/20 text-white border-transparent';
    }
    return 'bg-surface-container-low border-outline-variant/10 text-on-surface-variant';
  };

  const isManager = user?.role === 'Manager';

  return (
    <div className="flex-1 flex flex-col bg-background h-full w-full overflow-hidden">
      {/* Top Header */}
      <header className="h-20 bg-surface/80 backdrop-blur-md flex justify-between items-center px-container_margin border-b border-outline-variant/10 z-10 font-display">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-on-surface leading-tight">Table Management</h2>
            <p className="text-xs text-on-surface-variant/80 uppercase tracking-widest mt-0.5">Floor Plan • Main Dining Room</p>
          </div>
          <WebsocketStatus />
        </div>
        
        {isManager && (
          <div className="flex items-center gap-3">
            {isEditMode && (
              <button
                onClick={() => setShowAddModal(true)}
                className="h-12 px-4 bg-secondary text-on-secondary rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all text-xs uppercase tracking-wider"
              >
                <span className="material-symbols-outlined text-sm">add_box</span>
                Add Table
              </button>
            )}
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`h-12 px-5 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all text-xs uppercase tracking-wider shadow-sm ${
                isEditMode 
                  ? 'bg-status-warning text-status-on-warning hover:opacity-90' 
                  : 'bg-primary/10 text-primary hover:bg-primary/20'
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {isEditMode ? 'save' : 'edit_road'}
              </span>
              {isEditMode ? 'Exit Layout Editor' : 'Edit Layout'}
            </button>
          </div>
        )}
      </header>

      {/* Main Floor Area */}
      <div className="flex-1 p-container_margin overflow-hidden bg-surface-container-lowest/40 flex flex-col gap-6 relative select-none">
        
        {/* Status Indicators bar */}
        <div className="flex flex-wrap gap-4 py-3 px-6 bg-surface border border-outline-variant/20 rounded-2xl w-fit shadow-sm text-xs font-bold uppercase tracking-wider z-10">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-outline-variant"></div>
            <span className="text-on-surface-variant">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-status-occupied"></div>
            <span className="text-status-occupied">Dining</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-status-warning"></div>
            <span className="text-status-warning">Billed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-status-reserved"></div>
            <span className="text-status-reserved">Reserved</span>
          </div>
        </div>

        {/* Floor Canvas container */}
        <div 
          ref={containerRef}
          className={`flex-grow w-full rounded-[36px] relative overflow-hidden border-2 border-dashed transition-all duration-300 ${
            isEditMode 
              ? 'border-amber-500 bg-amber-500/5 shadow-inner' 
              : 'border-outline-variant/30 bg-surface-container-lowest/30 shadow-sm'
          }`}
          style={{
            backgroundImage: isEditMode 
              ? 'radial-gradient(#b5822f 1px, transparent 1px)' 
              : 'none',
            backgroundSize: '30px 30px'
          }}
        >
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/30 backdrop-blur-sm z-30">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-3 text-primary animate-spin">
                <span className="material-symbols-outlined text-2xl font-bold">sync</span>
              </div>
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest animate-pulse">
                Syncing Floor Plan...
              </p>
            </div>
          ) : (
            localTables.map((table) => {
              // Standardized responsive layout sizes
              const shapeClass = table.shape === 'circle' 
                ? 'rounded-full aspect-square w-28 h-28 flex flex-col items-center justify-center text-center p-3' 
                : table.shape === 'rectangle' 
                ? 'rounded-2xl w-36 h-24 flex flex-col justify-between text-left p-3' 
                : 'rounded-2xl w-28 h-28 flex flex-col justify-between text-left p-3';

              return (
                <div
                  key={table.id}
                  onMouseDown={(e) => handleDragStart(e, table)}
                  onTouchStart={(e) => handleDragStart(e, table)}
                  style={{
                    position: 'absolute',
                    left: `${table.pos_x}%`,
                    top: `${table.pos_y}%`,
                    transform: 'translate(-50%, -50%)',
                    cursor: isEditMode ? 'move' : 'pointer',
                    zIndex: 20
                  }}
                  className={`transition-shadow duration-200 ${isEditMode ? 'hover:scale-[1.02] hover:shadow-lg' : ''}`}
                >
                  <button
                    onClick={() => !isEditMode && onTableClick(table.name)}
                    disabled={isEditMode}
                    className={`border group shadow-sm select-none ${shapeClass} ${getStatusColor(table.status)}`}
                  >
                    {table.shape === 'circle' ? (
                      // Circle Centered Content
                      <div className="flex flex-col items-center justify-center w-full h-full gap-0.5">
                        <h3 className="text-xs font-bold font-display leading-tight text-current truncate max-w-full">
                          {table.name}
                        </h3>
                        <div className="text-[10px] font-medium opacity-80 text-current leading-none">
                          {table.seats} seats
                        </div>
                        {table.bill > 0 ? (
                          <div className="border-t border-current/20 pt-1 mt-1 text-[10px] font-bold font-mono leading-none text-current w-full text-center">
                            Rp {Math.floor(table.bill).toLocaleString('id-ID')}
                          </div>
                        ) : (
                          <div className="text-[8px] font-bold opacity-60 uppercase tracking-wider mt-1">
                            {table.status === 'Reserved' ? 'Reserved' : 'Ready'}
                          </div>
                        )}
                      </div>
                    ) : table.shape === 'rectangle' ? (
                      // Rectangle Compact Left-Right Content
                      <div className="flex flex-col justify-between w-full h-full">
                        <div className="flex justify-between items-start w-full">
                          <h3 className="text-sm font-bold font-display leading-none text-current">
                            {table.name}
                          </h3>
                          <span className="text-[10px] font-medium opacity-80 text-current">
                            {table.seats} seats
                          </span>
                        </div>
                        {table.bill > 0 ? (
                          <div className="border-t border-current/20 pt-1.5 text-xs font-bold font-display font-mono leading-none text-current w-full">
                            Rp {Math.floor(table.bill).toLocaleString('id-ID')}
                          </div>
                        ) : (
                          <div className="text-[8px] font-bold opacity-60 uppercase tracking-widest">
                            {table.status === 'Reserved' ? 'Reserved' : 'Ready'}
                          </div>
                        )}
                      </div>
                    ) : (
                      // Square Content
                      <div className="flex flex-col justify-between w-full h-full">
                        <div>
                          <h3 className="text-xs font-bold font-display leading-tight text-current">
                            {table.name}
                          </h3>
                          <div className="text-[10px] font-medium opacity-80 text-current mt-0.5">
                            {table.seats} seats
                          </div>
                        </div>
                        {table.bill > 0 ? (
                          <div className="border-t border-current/20 pt-1.5 text-xs font-bold font-display font-mono leading-none text-current w-full">
                            Rp {Math.floor(table.bill).toLocaleString('id-ID')}
                          </div>
                        ) : (
                          <div className="text-[8px] font-bold opacity-60 uppercase tracking-widest">
                            {table.status === 'Reserved' ? 'Reserved' : 'Ready'}
                          </div>
                        )}
                      </div>
                    )}
                  </button>

                  {isEditMode && (
                    <button
                      onClick={(e) => handleDeleteTable(table, e)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-error text-on-error rounded-full flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all border border-surface"
                      title="Delete Table"
                    >
                      <span className="material-symbols-outlined text-xs font-bold">close</span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Table Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-inverse-on-surface/40 backdrop-blur-md">
          <div className="bg-surface w-full max-w-sm rounded-3xl shadow-[0_16px_36px_rgba(0,0,0,0.12)] p-8 border border-outline-variant/30 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-4 mb-6">
              <h3 className="text-base font-bold font-display text-on-surface">Add New Table</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddTableSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-0.5">Table Identifier</label>
                <input 
                  type="text" 
                  value={newTableName} 
                  onChange={(e) => setNewTableName(e.target.value)}
                  placeholder="e.g. Table 15"
                  required
                  className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-xs font-semibold shadow-sm focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-0.5">Seats Count</label>
                <select 
                  value={newTableSeats} 
                  onChange={(e) => setNewTableSeats(parseInt(e.target.value))}
                  className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-xs font-semibold shadow-sm focus:ring-2 focus:ring-primary cursor-pointer"
                >
                  {[2, 4, 6, 8, 10, 12].map(n => <option key={n} value={n}>{n} Seats</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-0.5">Table Shape</label>
                <select 
                  value={newTableShape} 
                  onChange={(e) => setNewTableShape(e.target.value)}
                  className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-xs font-semibold shadow-sm focus:ring-2 focus:ring-primary cursor-pointer"
                >
                  <option value="circle">Circle</option>
                  <option value="square">Square</option>
                  <option value="rectangle">Rectangle</option>
                </select>
              </div>

              <button 
                type="submit"
                className="w-full h-12 bg-primary text-on-primary rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-md mt-6 text-xs uppercase tracking-wider"
              >
                Register Table
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
