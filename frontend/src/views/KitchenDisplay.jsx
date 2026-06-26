import React, { useState, useEffect } from 'react';
import useStore from '../store';
import { useNotification } from '../components/NotificationProvider';

export default function KitchenDisplay() {
  const { showToast } = useNotification();
  const orders = useStore((state) => state.orders);
  const updateOrderStatus = useStore((state) => state.updateOrderStatus);

  // Auto-refresh elapsed times every 15 seconds for precise SLA warning timing
  const [timeTick, setTimeTick] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setTimeTick(Date.now()), 15000);
    return () => clearInterval(interval);
  }, []);

  // Fullscreen state tracking
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Item plating strike states (local visual checklist for cooks)
  const [checkedItems, setCheckedItems] = useState({});

  const toggleItemChecked = (itemId) => {
    setCheckedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const activeOrders = orders
    .filter((o) => ['pending', 'preparing', 'ready'].includes(o.status))
    .sort((a, b) => new Date(a.createdAt || a.created_at) - new Date(b.createdAt || b.created_at));

  // Audio synthesizer alert for new orders
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

  const pendingOrders = activeOrders.filter((o) => o.status === 'pending');
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
      
      // Auto-check all items when order is marked as ready
      if (targetStatus === 'ready') {
        const order = activeOrders.find(o => o.id === orderId);
        if (order && order.items) {
          setCheckedItems(prev => {
            const next = { ...prev };
            order.items.forEach(item => {
              next[item.id] = true;
            });
            return next;
          });
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to update order status.', 'error');
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const getElapsedTime = (createdAt, tick) => {
    const elapsed = Math.floor((tick - new Date(createdAt)) / 60000);
    if (elapsed < 1) return 'Just now';
    return `${elapsed}m ago`;
  };

  const getSlaTimerStyles = (elapsedMins) => {
    if (elapsedMins >= 15) {
      return {
        cardBorder: 'bg-surface shadow-lg ring-1 ring-status-danger/15',
        headerBg: 'bg-status-danger text-status-on-danger',
        timerBadge: 'bg-white/20 text-white border border-white/20 font-mono font-bold',
      };
    }
    if (elapsedMins >= 10) {
      return {
        cardBorder: 'bg-surface shadow-md ring-1 ring-status-warning/15',
        headerBg: 'bg-status-warning text-status-on-warning',
        timerBadge: 'bg-white/20 text-white border border-white/20 font-mono font-bold',
      };
    }
    return {
      cardBorder: 'bg-surface shadow-sm hover:shadow-md ring-1 ring-outline-variant/5',
      headerBg: 'bg-surface-container text-on-surface border-b border-outline-variant/10',
      timerBadge: 'bg-surface border border-outline-variant/30 text-on-surface-variant font-mono font-semibold',
    };
  };

  return (
    <div className="flex-1 flex flex-col bg-background h-full w-full overflow-hidden">
      {/* Top Header */}
      <header className="h-20 bg-surface/80 backdrop-blur-md flex justify-between items-center px-container_margin border-b border-outline-variant/10 z-10 font-display shrink-0">
        <div>
          <h2 className="text-xl font-bold text-on-surface leading-tight">Kitchen Displays</h2>
          <p className="text-xs text-on-surface-variant/80 uppercase tracking-widest mt-0.5">
            Kitchen Production System (KDS) • {activeOrders.length} Active Tickets
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-2 px-4 py-2 border-2 border-primary/20 text-primary font-bold hover:bg-primary/5 active:scale-95 transition-all text-xs uppercase tracking-wider rounded-xl shadow-sm"
          >
            <span className="material-symbols-outlined text-base">
              {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
            </span>
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Mode'}
          </button>
        </div>
      </header>

      {/* Masonry Tickets Grid */}
      <div className="flex-grow overflow-y-auto custom-scrollbar p-container_margin bg-surface-container-lowest/10">
        {activeOrders.length > 0 ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6 pb-20">
            {activeOrders.map((order) => {
              const createdTime = order.createdAt || order.created_at;
              const elapsedMins = Math.floor((timeTick - new Date(createdTime)) / 60000);
              const elapsed = getElapsedTime(createdTime, timeTick);
              const styles = getSlaTimerStyles(elapsedMins);

              return (
                <div
                  key={order.id}
                  className={`break-inside-avoid mb-6 rounded-3xl border shadow-[0_4px_12px_rgba(0,0,0,0.01)] transition-all duration-200 flex flex-col justify-between overflow-hidden ${styles.cardBorder}`}
                >
                  <div>
                    {/* SLA styled Header */}
                    <div className={`p-4 flex justify-between items-center font-display ${styles.headerBg}`}>
                      <div>
                        <h4 className="text-sm font-extrabold">{order.table?.name || 'Table'}</h4>
                        <p className="text-[9px] font-bold opacity-80 uppercase tracking-wider mt-0.5 font-mono">
                          Order #{order.id}
                        </p>
                      </div>
                      <span className={`text-[10px] font-mono rounded-full px-2.5 py-0.5 select-none ${styles.timerBadge}`}>
                        {elapsed}
                      </span>
                    </div>

                    {/* Plating Checklist Items */}
                    <div className="p-4 space-y-2">
                      {order.items.map((item) => {
                        const isChecked = !!checkedItems[item.id];
                        return (
                          <div
                            key={item.id}
                            onClick={() => toggleItemChecked(item.id)}
                            className="group flex flex-col gap-1.5 text-xs font-semibold text-on-surface-variant cursor-pointer hover:bg-surface-container-low/50 p-2 rounded-xl select-none transition-colors border border-transparent hover:border-outline-variant/10"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${
                                isChecked
                                  ? 'bg-primary border-primary text-on-primary'
                                  : 'border-outline-variant/60 bg-surface group-hover:border-primary/50'
                              }`}>
                                {isChecked ? (
                                  <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                                ) : (
                                  <span className="material-symbols-outlined text-[14px] font-bold opacity-0 group-hover:opacity-30">check</span>
                                )}
                              </div>
                              <span className="w-6 h-6 bg-primary/10 text-primary font-extrabold rounded-lg flex items-center justify-center text-xs shrink-0">
                                {item.qty}
                              </span>
                              <span className={`transition-all ${isChecked ? 'line-through opacity-40' : 'text-on-surface'}`}>
                                {item.product?.name}
                              </span>
                            </div>
                            {item.note && typeof item.note === 'string' && item.note.trim() !== '' && (
                              <div className="pl-9 pr-2">
                                <p className="text-[10px] text-status-warning italic bg-status-warning/10 px-2.5 py-1 rounded-lg border border-status-warning/20 inline-block font-bold">
                                  💡 "{item.note}"
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* KDS Status controls */}
                  <div className="p-4 pt-0 mt-1 flex gap-2">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleStatusTransition(order.id, 'preparing')}
                        className="w-full py-3 bg-status-warning text-status-on-warning rounded-xl font-bold hover:opacity-95 active:scale-[0.98] transition-all text-[11px] uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">outdoor_grill</span>
                        Start Cooking
                      </button>
                    )}

                    {order.status === 'preparing' && (
                      <button
                        onClick={() => handleStatusTransition(order.id, 'ready')}
                        className="w-full py-3 bg-status-success text-status-on-success rounded-xl font-bold hover:opacity-95 active:scale-[0.98] transition-all text-[11px] uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">notifications_active</span>
                        Mark Ready
                      </button>
                    )}

                    {order.status === 'ready' && (
                      <button
                        onClick={() => handleStatusTransition(order.id, 'served')}
                        className="w-full py-3 bg-surface-container border border-outline-variant/30 text-on-surface-variant rounded-xl font-bold hover:bg-surface-container-high active:scale-95 transition-all text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        Dismiss (Served)
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-12 text-on-surface-variant/70 min-h-[50vh]">
            <span className="material-symbols-outlined text-[64px] opacity-35 mb-4" style={{ fontVariationSettings: '"FILL" 1' }}>
              outdoor_grill
            </span>
            <p className="text-sm font-bold font-display uppercase tracking-wider">All Clear! No orders in queue</p>
            <p className="text-xs max-w-xs mt-1.5 leading-relaxed">
              When servers send new orders to the kitchen, they will immediately appear as tickets in this live Masonry dashboard.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
