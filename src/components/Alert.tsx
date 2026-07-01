import React from 'react';

export function Alert({ type, message }: { type: 'success' | 'warning' | 'danger' | 'info'; message: string }) {
  const colorMap = {
    success: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
    warning: 'text-amber-400 border-amber-500/20 bg-amber-500/5',
    danger: 'text-red-400 border-red-500/20 bg-red-500/5',
    info: 'text-blue-400 border-blue-500/20 bg-blue-500/5',
  };

  return (
    <div className={`p-4 rounded-xl border flex items-start gap-3 ${colorMap[type] || colorMap.info}`}>
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}
