import React, { useState, useEffect } from 'react';
import useStore from '../store';
import { useNotification } from '../components/NotificationProvider';

export default function KitchenDisplay() {
  const { showToast } = useNotification();
  const orders = useStore((state) => state.orders);
  const updateOrderStatus = useStore((state) => state.updateOrderStatus);

  // KDS local states
  const [activeTab, setActiveTab] = useState('all');

  const activeOrders = orders.filter((o) => 
    ['pending', 'preparing', 'ready'].includes(o.status)
  );

  const pendingOrders = activeOrders.filter((o) => o.status === 'pending');
  const preparingOrders = activeOrders.filter((o) => o.status === 'preparing');
  const readyOrders = activeOrders.filter((o) => o.status === 'ready');

  // Audio synthezier alert for new orders
  const playNewOrderSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      console.error('Audio playback block', e);
    }
  };

  const pendingCount = pendingOrders.length;
  const [prevCount, setPrevCount] = useState(pendingCount);

  useEffect(() => {
    if (pendingCount > prevCount) {
      playNewOrderSound();
      showToast('New incoming order sent to kitchen!', 'info');
    }
    setPrevCount(pendingCount);
  }, [pendingCount]);

  const handleStatusTransition = async (orderId, targetStatus) => {
    try {
      await updateOrderStatus(orderId, targetStatus);
      showToast(`Order status updated successfully.`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to update order status.', 'error');
    }
  };

  const getElapsedTime = (createdAt) => {
    const elapsed = Math.floor((new Date() - new Date(createdAt)) / 60000);
    if (elapsed < 1) return 'Just now';
    return `${elapsed} min ago`;
  };

  const renderOrderCard = (order) => {
    const elapsed = getElapsedTime(order.created_at);
    const isLate = Math.floor((new Date() - new Date(order.created_at)) / 60000) > 15;

    return (
      <div 
        key={order.id} 
        className={`bg-surface p-5 rounded-3xl border shadow-[0_4px_12px_rgba(0,0,0,0.01)] flex flex-col justify-between transition-all duration-200 ${
          isLate ? 'border-error/30 bg-error-container/5 animate-pulse' : 'border-outline-variant/30 hover:shadow-md'
        }`}
      >
        <div>
          <div className="flex justify-between items-center pb-3 border-b border-outline-variant/10 mb-3 font-display">
            <div>
              <h4 className="text-sm font-bold text-on-surface">{order.table?.name || 'Table'}</h4>
              <p className="text-[10px] font-semibold text-primary uppercase tracking-widest mt-0.5 font-mono">
                Order #{order.id}
              </p>
            </div>
            <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${isLate ? 'text-error bg-error/15' : 'text-on-surface-variant bg-surface-container'}`}>
              {elapsed}
            </span>
          </div>

          <div className="space-y-2.5 pb-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-start text-xs font-semibold text-on-surface-variant">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary/10 text-primary font-bold rounded-lg flex items-center justify-center text-xs">
                    {item.qty}
                  </span>
                  <span>{item.product?.name}</span>
                </div>
                {item.note && (
                  <p className="text-[9px] text-amber-800 italic mt-0.5 max-w-[120px] bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                    "{item.note}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-outline-variant/10 mt-2 flex gap-2">
          {order.status === 'pending' && (
            <button
              onClick={() => handleStatusTransition(order.id, 'preparing')}
              className="w-full py-2.5 bg-amber-600 text-white rounded-xl font-bold hover:opacity-90 active:scale-95 transition-all text-[11px] uppercase tracking-wider shadow-sm"
            >
              Start Cooking
            </button>
          )}

          {order.status === 'preparing' && (
            <button
              onClick={() => handleStatusTransition(order.id, 'ready')}
              className="w-full py-2.5 bg-tertiary text-on-tertiary rounded-xl font-bold hover:opacity-90 active:scale-95 transition-all text-[11px] uppercase tracking-wider shadow-sm"
            >
              Mark Ready
            </button>
          )}

          {order.status === 'ready' && (
            <button
              onClick={() => handleStatusTransition(order.id, 'served')}
              className="w-full py-2.5 bg-surface-container border border-outline-variant/30 text-on-surface-variant rounded-xl font-bold hover:bg-surface-container-high active:scale-95 transition-all text-[11px] uppercase tracking-wider"
            >
              Dismiss (Served)
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-background h-full w-full overflow-hidden">
      {/* Top Header */}
      <header className="h-20 bg-surface/80 backdrop-blur-md flex justify-between items-center px-container_margin border-b border-outline-variant/10 z-10 font-display">
        <div>
          <h2 className="text-xl font-bold text-on-surface leading-tight">Kitchen Displays</h2>
          <p className="text-xs text-on-surface-variant/80 uppercase tracking-widest mt-0.5">Kitchen Production System (KDS) • Real-time</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></span>
          <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Websocket Live</span>
        </div>
      </header>

      {/* Kanban Layout */}
      <div className="flex-grow p-container_margin grid grid-cols-1 md:grid-cols-3 gap-gutter overflow-hidden items-stretch pb-8 bg-surface-container-lowest/10">
        
        {/* COLUMN 1: PENDING / NEW */}
        <div className="flex flex-col bg-surface-container-low/40 rounded-3xl border border-outline-variant/20 overflow-hidden">
          <div className="p-5 border-b border-outline-variant/10 bg-surface flex justify-between items-center">
            <h3 className="text-xs font-bold font-display uppercase tracking-widest text-on-surface flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
              New Incoming
            </h3>
            <span className="px-2 py-0.5 bg-error/15 text-error text-[10px] font-bold font-mono rounded-full">
              {pendingOrders.length}
            </span>
          </div>
          <div className="flex-grow p-4 overflow-y-auto custom-scrollbar flex flex-col gap-4">
            {pendingOrders.length > 0 ? (
              pendingOrders.map(renderOrderCard)
            ) : (
              <div className="my-auto text-center p-6 text-on-surface-variant/50">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-30">check_circle</span>
                <p className="text-[10px] font-bold uppercase tracking-wider">Queue Cleared</p>
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 2: COOKING / PREPARING */}
        <div className="flex flex-col bg-surface-container-low/40 rounded-3xl border border-outline-variant/20 overflow-hidden">
          <div className="p-5 border-b border-outline-variant/10 bg-surface flex justify-between items-center">
            <h3 className="text-xs font-bold font-display uppercase tracking-widest text-on-surface flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Preparing / Cooking
            </h3>
            <span className="px-2 py-0.5 bg-amber-500/15 text-amber-700 text-[10px] font-bold font-mono rounded-full">
              {preparingOrders.length}
            </span>
          </div>
          <div className="flex-grow p-4 overflow-y-auto custom-scrollbar flex flex-col gap-4">
            {preparingOrders.length > 0 ? (
              preparingOrders.map(renderOrderCard)
            ) : (
              <div className="my-auto text-center p-6 text-on-surface-variant/50">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-30">outdoor_grill</span>
                <p className="text-[10px] font-bold uppercase tracking-wider">No Active Cooking</p>
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 3: READY FOR PICKUP */}
        <div className="flex flex-col bg-surface-container-low/40 rounded-3xl border border-outline-variant/20 overflow-hidden">
          <div className="p-5 border-b border-outline-variant/10 bg-surface flex justify-between items-center">
            <h3 className="text-xs font-bold font-display uppercase tracking-widest text-on-surface flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Ready / Pickup
            </h3>
            <span className="px-2 py-0.5 bg-green-500/15 text-green-700 text-[10px] font-bold font-mono rounded-full">
              {readyOrders.length}
            </span>
          </div>
          <div className="flex-grow p-4 overflow-y-auto custom-scrollbar flex flex-col gap-4">
            {readyOrders.length > 0 ? (
              readyOrders.map(renderOrderCard)
            ) : (
              <div className="my-auto text-center p-6 text-on-surface-variant/50">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-30">hail</span>
                <p className="text-[10px] font-bold uppercase tracking-wider">No food waiting</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
