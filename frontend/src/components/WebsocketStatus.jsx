import React, { useState, useEffect } from 'react';
import useStore from '../store';

export default function WebsocketStatus() {
  const [status, setStatus] = useState('disconnected');
  const socket = useStore((state) => state.socket);

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
    switch (status) {
      case 'connected':
        return { color: 'bg-status-success shadow-[0_0_8px_rgba(45,106,79,0.5)]', label: 'Live' };
      case 'connecting':
        return { color: 'bg-status-warning animate-pulse', label: 'Connecting' };
      default:
        return { color: 'bg-status-danger animate-pulse shadow-[0_0_8px_rgba(186,26,26,0.5)]', label: 'Offline' };
    }
  };

  const details = getStatusDetails();

  return (
    <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-full border border-outline-variant/10 shadow-sm">
      <span className={`w-2 h-2 rounded-full ${details.color}`} />
      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider leading-none">
        {details.label}
      </span>
    </div>
  );
}
