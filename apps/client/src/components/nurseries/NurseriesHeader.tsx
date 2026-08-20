import React from 'react';
import { Plus } from 'lucide-react';

interface NurseriesHeaderProps {
  onAddNursery: () => void;
}

export function NurseriesHeader({ onAddNursery }: NurseriesHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Nurseries</h1>
        <p className="text-slate-600 mt-2">Manage your plant nurseries and suppliers</p>
      </div>
      <button 
        onClick={onAddNursery}
        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>Add Nursery</span>
      </button>
    </div>
  );
}
