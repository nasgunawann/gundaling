import React from 'react';

export default function TicketCard({
  order,
  timeTick,
  checkedItems,
  toggleItemChecked,
  handleStatusTransition,
  getElapsedTime,
  getSlaTimerStyles,
}) {
  const createdTime = order.createdAt || order.created_at;
  const elapsedMins = Math.floor((timeTick - new Date(createdTime)) / 60000);
  const elapsed = getElapsedTime(createdTime, timeTick);
  const styles = getSlaTimerStyles(elapsedMins);

  return (
    <div
      className={`break-inside-avoid mb-6 rounded-3xl border shadow-[0_4px_12px_rgba(0,0,0,0.01)] transition-all duration-200 flex flex-col justify-between overflow-hidden ${
        order.isPendingSync ? 'border-dashed border-status-warning shadow-[0_4px_12px_rgba(245,158,11,0.15)]' : styles.cardBorder
      }`}
    >
      <div>
        {/* SLA styled Header */}
        <div className={`p-4 flex justify-between items-center font-display ${order.isPendingSync ? 'bg-status-warning/10 text-status-warning' : styles.headerBg}`}>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm font-extrabold">{order.table?.name || 'Table'}</h4>
              {order.isPendingSync && (
                <span className="material-symbols-outlined text-[14px] animate-pulse" title="Pending Sync">cloud_upload</span>
              )}
            </div>
            <p className="text-[9px] font-bold opacity-80 uppercase tracking-wider mt-0.5 font-mono">
              Order #{order.id}
            </p>
          </div>
          <span className={`text-[10px] font-mono rounded-full px-2.5 py-0.5 select-none ${order.isPendingSync ? 'bg-status-warning/20 text-status-warning font-bold' : styles.timerBadge}`}>
            {order.isPendingSync ? 'OFFLINE' : elapsed}
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
                    "{item.note}"
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
            disabled={order.isPendingSync}
            onClick={() => handleStatusTransition(order.id, 'preparing')}
            className={`w-full py-3 rounded-xl font-bold active:scale-[0.98] transition-all text-[11px] uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 ${
              order.isPendingSync
                ? 'bg-outline-variant/20 text-on-surface-variant/40 cursor-not-allowed'
                : 'bg-status-warning text-status-on-warning hover:opacity-95'
            }`}
          >
            <span className="material-symbols-outlined text-sm">outdoor_grill</span>
            {order.isPendingSync ? 'Syncing...' : 'Start Cooking'}
          </button>
        )}

        {order.status === 'preparing' && (
          <button
            disabled={order.isPendingSync}
            onClick={() => handleStatusTransition(order.id, 'ready')}
            className={`w-full py-3 rounded-xl font-bold active:scale-[0.98] transition-all text-[11px] uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 ${
              order.isPendingSync
                ? 'bg-outline-variant/20 text-on-surface-variant/40 cursor-not-allowed'
                : 'bg-status-success text-status-on-success hover:opacity-95'
            }`}
          >
            <span className="material-symbols-outlined text-sm">notifications_active</span>
            {order.isPendingSync ? 'Syncing...' : 'Mark Ready'}
          </button>
        )}

        {order.status === 'ready' && (
          <button
            disabled={order.isPendingSync}
            onClick={() => handleStatusTransition(order.id, 'served')}
            className={`w-full py-3 rounded-xl font-bold active:scale-95 transition-all text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 ${
              order.isPendingSync
                ? 'bg-outline-variant/20 border border-outline-variant/10 text-on-surface-variant/40 cursor-not-allowed'
                : 'bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-sm">check_circle</span>
            {order.isPendingSync ? 'Syncing...' : 'Dismiss (Served)'}
          </button>
        )}
      </div>
    </div>
  );
}
