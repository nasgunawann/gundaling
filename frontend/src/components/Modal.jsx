import React from 'react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60">
      <div 
        className={`bg-surface w-full ${maxWidth} rounded-3xl shadow-[0_16px_36px_rgba(0,0,0,0.12)] p-8 border border-outline-variant/30`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex justify-between items-center border-b border-outline-variant/20 pb-4 mb-6">
          <h3 className="text-base font-bold font-display text-on-surface">{title}</h3>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none transition-all touch-manipulation"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
