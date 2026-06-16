import React, { useState, useEffect } from 'react';

export default function WebsocketStatus() {
  const [status, setStatus] = useState('disconnected');

  useEffect(() => {
    const checkStatus = () => {
      if (window.Echo && window.Echo.connector && window.Echo.connector.pusher) {
        const pusher = window.Echo.connector.pusher;
        setStatus(pusher.connection.state);

        const handleStateChange = (states) => {
          setStatus(states.current);
        };

        pusher.connection.bind('state_change', handleStateChange);
        return () => {
          pusher.connection.unbind('state_change', handleStateChange);
        };
      } else {
        setStatus('disconnected');
      }
    };

    // Retry checking if window.Echo isn't ready immediately
    const timer = setInterval(checkStatus, 1000);
    checkStatus();

    return () => clearInterval(timer);
  }, []);

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
