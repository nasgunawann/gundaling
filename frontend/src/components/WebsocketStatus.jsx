import React, { useState, useEffect } from 'react';
import useStore from '../store';

export default function WebsocketStatus({ showLabel = true }) {
  const [status, setStatus] = useState('disconnected');
  const socket = useStore((state) => state.socket);
  const syncQueue = useStore((state) => state.syncQueue);

  useEffect(() => {
    if (!socket) {
      setStatus('disconnected');
      return;
    }

    const onConnect = () => setStatus('connected');
    const onDisconnect = () => setStatus('disconnected');

    if (socket.connected) {
      setStatus('connected');
    } else {
      setStatus('connecting');
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [socket]);

  const getStatusDetails = () => {
    const isDisconnected = !socket || !socket.connected;

    if (syncQueue.length > 0 && isDisconnected) {
      return {
        icon: 'sync',
        iconAnim: 'animate-spin',
        color: 'text-status-warning',
        label: `Offline (${syncQueue.length})`,
        tooltip: `Connection lost — ${syncQueue.length} change${syncQueue.length > 1 ? 's' : ''} queued, will sync automatically`,
      };
    }

    if (syncQueue.length > 0) {
      return {
        icon: 'sync',
        iconAnim: 'animate-spin',
        color: 'text-status-warning',
        label: `Syncing (${syncQueue.length})`,
        tooltip: `Syncing ${syncQueue.length} pending change${syncQueue.length > 1 ? 's' : ''} to server`,
      };
    }

    switch (status) {
      case 'connected':
        return {
          icon: 'cloud_done',
          iconAnim: '',
          color: 'text-status-success',
          label: 'Live',
          tooltip: 'Connected — real-time updates active',
        };
      case 'connecting':
        return {
          icon: 'sync',
          iconAnim: 'animate-spin',
          color: 'text-status-warning',
          label: 'Connecting',
          tooltip: 'Reconnecting to server...',
        };
      default:
        return {
          icon: 'cloud_off',
          iconAnim: '',
          color: 'text-status-danger',
          label: 'Offline',
          tooltip: 'Connection lost — changes saved locally, will sync automatically',
        };
    }
  };

  const details = getStatusDetails();

  return (
    <div
      className={`flex items-center gap-2 bg-surface-container-low rounded-full border border-outline-variant/10 shadow-sm ${
        showLabel ? 'px-3 py-1.5' : 'w-10 h-10 items-center justify-center'
      }`}
      title={details.tooltip}
    >
      <span className={`material-symbols-outlined text-sm ${details.iconAnim} ${details.color}`}>
        {details.icon}
      </span>
      {showLabel && (
        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider leading-none">
          {details.label}
        </span>
      )}
    </div>
  );
}
