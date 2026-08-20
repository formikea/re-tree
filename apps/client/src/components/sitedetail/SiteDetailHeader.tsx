import React from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { SiteDetailHeaderProps } from './types';

export function SiteDetailHeader({ site, siteId, onAddSeason, onBack }: SiteDetailHeaderProps) {
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
            {site?.name || (siteId ? `Site ${siteId}` : 'Site Allotments')}
          </h1>
          <p className="text-slate-600 mt-2">Create allotments by species and season</p>
        </div>
      </div>
      <button 
        onClick={onAddSeason}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>Add Season</span>
      </button>
    </div>
  );
}
