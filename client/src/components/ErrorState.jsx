import React from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';

/**
 * Shown when a fetch actually failed, as opposed to succeeding and coming
 * back empty. Those two cases used to render identically ("No items
 * found.", an empty table), so a dead backend looked to the user like a
 * shop with nothing in it.
 */
const ErrorState = ({
  title = "Couldn't load this",
  message = "We couldn't reach the server. Check your connection and try again.",
  onRetry,
  className = '',
}) => (
  <div
    className={`flex flex-col items-center gap-3 rounded-lg border border-dashed border-[#B23B28]/40 bg-[#B23B28]/5 px-6 py-10 text-center ${className}`}
  >
    <AlertTriangle size={22} className="text-[#B23B28]" />
    <div>
      <p className="font-semibold text-[#B23B28]">{title}</p>
      <p className="mt-1 text-sm italic text-bean">{message}</p>
    </div>
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-1 inline-flex items-center gap-2 rounded border border-[#B23B28]/40 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#B23B28] transition-colors hover:bg-[#B23B28]/10"
      >
        <RotateCw size={12} />
        Try again
      </button>
    )}
  </div>
);

export default ErrorState;
