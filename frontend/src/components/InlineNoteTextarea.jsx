import React, { useState, useEffect } from 'react';

export default function InlineNoteTextarea({ itemId, initialValue, onSave, onCancel }) {
  const [localVal, setLocalVal] = useState(initialValue || '');

  // Keep local value synced with outside changes if any
  useEffect(() => {
    setLocalVal(initialValue || '');
  }, [initialValue]);

  const handleBlur = () => {
    onSave(localVal);
  };

  return (
    <textarea
      value={localVal}
      onChange={(e) => setLocalVal(e.target.value)}
      onBlur={handleBlur}
      placeholder="Tulis catatan..."
      className="min-h-[48px] w-full rounded-xl border border-outline-variant/10 bg-surface-container-low px-3 py-2 text-[10px] leading-snug text-on-surface resize-none outline-none focus:border-primary/15 focus:ring-1 focus:ring-primary/15 mt-1"
      autoFocus
    />
  );
}
