import React from 'react';
import { MapPin, Calendar, Package } from 'lucide-react';
import { SeasonInfoCardProps } from './types';

export function SeasonInfoCard({ 
  site, 
  season, 
  totalAllocated, 
  allotmentsCount, 
  formatDate, 
  getSeasonDisplayName 
}: SeasonInfoCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
            <MapPin className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Site Details</h3>
            <p className="text-slate-600">{site.region} • {site.type}</p>
            <p className="text-sm text-slate-500">{site.area} hectares</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Season Info</h3>
            <p className="text-slate-600">{getSeasonDisplayName(season.season)} {season.year}</p>
            <p className="text-sm text-slate-500">Created {formatDate(season.createdAt)}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <Package className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Allocation Summary</h3>
            <p className="text-slate-600">{totalAllocated.toLocaleString()} plants allocated</p>
            <p className="text-sm text-slate-500">{allotmentsCount} allotments</p>
          </div>
        </div>
      </div>

      {season.notes && (
        <div className="mt-6 pt-6 border-t border-slate-200">
          <h4 className="font-medium text-slate-900 mb-2">Season Notes</h4>
          <p className="text-slate-600">{season.notes}</p>
        </div>
      )}
    </div>
  );
} 