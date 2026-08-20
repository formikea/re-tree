import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      <span className="ml-2 text-slate-600">Loading nurseries...</span>
    </div>
  );
}
