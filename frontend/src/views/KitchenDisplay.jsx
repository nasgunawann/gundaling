import React, { useState, useEffect } from 'react';
import useStore from '../store';
import { useNotification } from '../components/NotificationProvider';
import TicketCard from '../components/TicketCard';

export default function KitchenDisplay({ setIsSidebarCollapsed }) {
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
    let wasCollapsedBefore = false;
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFullscreen);
      if (isCurrentlyFullscreen) {
        wasCollapsedBefore = localStorage.getItem('gundaling_sidebar_collapsed') === 'true';
        if (setIsSidebarCollapsed) {
          setIsSidebarCollapsed(true);
        }
      } else {
        if (setIsSidebarCollapsed) {
          setIsSidebarCollapsed(wasCollapsedBefore);
        }
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [setIsSidebarCollapsed]);

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
    if (elapsedMins >= 25) {
      return {
        cardBorder: 'bg-surface shadow-lg ring-1 ring-status-danger/15',
        headerBg: 'bg-status-danger text-status-on-danger',
        timerBadge: 'bg-white/20 text-white border border-white/20 font-mono font-bold',
      };
    }
    if (elapsedMins >= 15) {
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
      <header className="h-20 bg-surface flex justify-between items-center px-container_margin border-b border-outline-variant/10 z-10 font-display shrink-0">
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
            {activeOrders.map((order) => (
              <TicketCard 
                key={order.id}
                order={order}
                timeTick={timeTick}
                checkedItems={checkedItems}
                toggleItemChecked={toggleItemChecked}
                handleStatusTransition={handleStatusTransition}
                getElapsedTime={getElapsedTime}
                getSlaTimerStyles={getSlaTimerStyles}
              />
            ))}
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
