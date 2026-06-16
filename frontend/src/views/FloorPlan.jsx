import React, { useState, useEffect, useRef } from 'react';
import useStore from '../store';
import { useNotification } from '../components/NotificationProvider';
import api from '../api';

export default function FloorPlan({ onTableClick, user, tableCarts, tables: backendTables }) {
  const { showToast, showConfirm } = useNotification();
  const containerRef = useRef(null);

  const updateTablePosition = useStore((state) => state.updateTablePosition);
  const fetchInitialData = useStore((state) => state.fetchInitialData);
  const loading = useStore((state) => state.loading);

  const [isEditMode, setIsEditMode] = useState(false);
  const [localTables, setLocalTables] = useState([]);
  
  // Create table modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableSeats, setNewTableSeats] = useState(4);
  const [newTableShape, setNewTableShape] = useState('square');

  const defaultTables = [
    { id: 1, name: 'Table 01', seats: 4, shape: 'circle', pos_x: 10, pos_y: 15, status: 'Available' },
    { id: 2, name: 'Table 02', seats: 2, shape: 'square', pos_x: 30, pos_y: 15, status: 'Reserved' },
    { id: 3, name: 'Table 03', seats: 4, shape: 'square', pos_x: 50, pos_y: 15, status: 'Occupied' },
    { id: 4, name: 'Table 04', seats: 4, shape: 'square', pos_x: 70, pos_y: 15, status: 'Occupied' },
    { id: 5, name: 'Table 05', seats: 6, shape: 'rectangle', pos_x: 10, pos_y: 45, status: 'Available' },
    { id: 6, name: 'Table 06', seats: 2, shape: 'circle', pos_x: 30, pos_y: 45, status: 'Available' },
    { id: 7, name: 'Table 07', seats: 8, shape: 'rectangle', pos_x: 50, pos_y: 45, status: 'Reserved' },
    { id: 8, name: 'Table 08', seats: 6, shape: 'rectangle', pos_x: 70, pos_y: 45, status: 'Occupied' },
    { id: 12, name: 'Table 12', seats: 4, shape: 'circle', pos_x: 90, pos_y: 45, status: 'Occupied' }
  ];

  const isLoading = loading && (!backendTables || backendTables.length === 0);
  const rawTables = backendTables && backendTables.length > 0 ? backendTables : (isLoading ? [] : defaultTables);

  // Process live dynamic status
  const tables = rawTables.map(t => {
    const cart = tableCarts[t.name] || [];
    const hasItems = cart.length > 0;

    let status = t.status || 'Available';
    let billTotal = 0;

    if (hasItems) {
      const hasUnsent = cart.some(item => !item.sent);
      status = hasUnsent ? 'Pending Kitchen' : 'Occupied';
      billTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0) * 1.1;
    } else if (status.startsWith('Occupied') || status === 'Pending Kitchen') {
      status = 'Available';
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
  }, [backendTables, tableCarts]);

  const handleMouseDown = (e, table) => {
    if (!isEditMode) return;
    e.preventDefault();
    
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();

    const handleMouseMove = (moveEvent) => {
      let x = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      let y = ((moveEvent.clientY - rect.top) / rect.height) * 100;

      // Clamp values (e.g. w-32/h-32 is roughly 10% on standard screen width)
      x = Math.max(1, Math.min(88, x));
      y = Math.max(1, Math.min(85, y));

      setLocalTables(prev => 
        prev.map(t => t.id === table.id ? { ...t, pos_x: parseFloat(x.toFixed(2)), pos_y: parseFloat(y.toFixed(2)) } : t)
      );
    };

    const handleMouseUp = async () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      const dragTarget = localTables.find(t => t.id === table.id);
      if (dragTarget) {
        await updateTablePosition(table.id, dragTarget.pos_x, dragTarget.pos_y);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
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
    if (status.startsWith('Occupied')) return 'bg-primary border-primary text-on-primary';
    if (status === 'Pending Kitchen') return 'bg-tertiary border-tertiary text-on-tertiary';
    if (status === 'Reserved') return 'bg-secondary border-secondary text-on-secondary';
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
        <div>
          <h2 className="text-xl font-bold text-on-surface leading-tight">Table Management</h2>
          <p className="text-xs text-on-surface-variant/80 uppercase tracking-widest mt-0.5">Floor Plan • Main Dining Room</p>
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
                  ? 'bg-amber-600 text-white hover:bg-amber-700' 
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
        <div className="flex gap-6 py-3 px-6 bg-surface border border-outline-variant/20 rounded-2xl w-fit shadow-sm text-xs font-bold uppercase tracking-wider z-10">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-outline-variant"></div>
            <span className="text-on-surface-variant">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-tertiary"></div>
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
              const shapeClass = table.shape === 'circle' 
                ? 'rounded-full aspect-square' 
                : table.shape === 'rectangle' 
                ? 'rounded-2xl w-40 h-28' 
                : 'rounded-2xl w-32 h-32';

              const diameterClass = table.shape === 'circle' ? 'w-32 h-32' : '';

              return (
                <div
                  key={table.id}
                  onMouseDown={(e) => handleMouseDown(e, table)}
                  style={{
                    position: 'absolute',
                    left: `${table.pos_x}%`,
                    top: `${table.pos_y}%`,
                    transform: 'translate(-50%, -50%)',
                    cursor: isEditMode ? 'move' : 'pointer',
                    zIndex: 20
                  }}
                  className={`transition-shadow duration-200 ${isEditMode ? 'hover:scale-102 hover:shadow-lg' : ''}`}
                >
                  <button
                    onClick={() => !isEditMode && onTableClick(table.name)}
                    disabled={isEditMode}
                    className={`border p-4 flex flex-col justify-between text-left group shadow-sm select-none ${shapeClass} ${diameterClass} ${getStatusColor(table.status)}`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <h3 className="text-[11px] font-bold font-display leading-none text-current">
                        {table.name}
                      </h3>
                      {!isEditMode && (
                        <span className={`text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border leading-none ${getBadgeStyle(table.status)}`}>
                          {table.status}
                        </span>
                      )}
                    </div>

                    <div className="text-[9px] font-semibold opacity-85 text-current mt-1">
                      {table.seats} Seats
                    </div>

                    <div className="border-t border-current/20 pt-2 flex justify-between items-center w-full mt-2">
                      {table.bill > 0 ? (
                        <span className="text-[10px] font-bold font-display font-mono leading-none text-current">
                          Rp {Math.floor(table.bill).toLocaleString('id-ID')}
                        </span>
                      ) : (
                        <span className="text-[7px] font-bold opacity-80 uppercase tracking-widest text-current">
                          {table.status === 'Reserved' ? 'Reserved' : 'Ready'}
                        </span>
                      )}
                    </div>
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
                className="w-full h-13 bg-primary text-on-primary rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-md mt-6 text-xs uppercase tracking-wider"
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
