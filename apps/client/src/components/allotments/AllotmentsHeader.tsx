import React from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { AllotmentsHeaderProps } from './types';

export function AllotmentsHeader({ 
  siteName, 
  seasonName, 
  year, 
  onBack, 
  onAddAllotment 
}: AllotmentsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {siteName} - {seasonName} {year}
          </h1>
          <p className="text-slate-600 mt-2">Manage plant allotments for this season</p>
        </div>
      </div>
      <button 
        onClick={onAddAllotment}
        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>Add Allotment</span>
      </button>
    </div>
  );
} 