import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, Filter, Eye, Edit, Trash2, Loader2 } from 'lucide-react';
import { ApiSite } from '@services/api';
import { TypeStyles } from './types';

interface SitesTableProps {
  sites: ApiSite[];
  isLoading: boolean;
  onEditSite: (site: ApiSite) => void;
  onDeleteSite: (site: ApiSite) => void;
}

export function SitesTable({ sites, isLoading, onEditSite, onDeleteSite }: SitesTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const navigate = useNavigate();

  const typeStyles: TypeStyles = {
    'Regional Park': 'bg-emerald-100 text-emerald-700',
    'Scientific Reserve': 'bg-blue-100 text-blue-700',
    'Conservation Area': 'bg-purple-100 text-purple-700',
    'Private Land': 'bg-orange-100 text-orange-700'
  };

  const filteredSites = sites.filter(site => {
    // Add safety checks to prevent crashes
    if (!site || !site.name || !site.region || !site.owner) {
      console.warn('Invalid site data:', site);
      return false;
    }
    
    const matchesSearch = site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         site.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         site.owner.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || site.type === filterType;
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <span className="ml-2 text-slate-600">Loading sites...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search sites..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-64 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="Regional Park">Regional Park</option>
            <option value="Scientific Reserve">Scientific Reserve</option>
            <option value="Conservation Area">Conservation Area</option>
            <option value="Private Land">Private Land</option>
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-4 font-medium text-slate-900">Site Name</th>
              <th className="text-left py-3 px-4 font-medium text-slate-900">Region</th>
              <th className="text-left py-3 px-4 font-medium text-slate-900">Area</th>
              <th className="text-left py-3 px-4 font-medium text-slate-900">Type</th>
              <th className="text-left py-3 px-4 font-medium text-slate-900">Owner</th>
              <th className="text-left py-3 px-4 font-medium text-slate-900">Coordinates</th>
              <th className="text-right py-3 px-4 font-medium text-slate-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSites.map((site) => (
              <tr 
                key={site.id} 
                className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => navigate(`/sites/${site.id}`)}
              >
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">
                        {site.name}
                      </div>
                      <div className="text-sm text-slate-600">{site.notes}</div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-slate-900">{site.region}</td>
                <td className="py-4 px-4 text-slate-900">{site.area} ha</td>
                <td className="py-4 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeStyles[site.type as keyof TypeStyles] || 'bg-gray-100 text-gray-700'}`}>
                    {site.type}
                  </span>
                </td>
                <td className="py-4 px-4 text-slate-900">{site.owner}</td>
                <td className="py-4 px-4 text-slate-900 text-sm">{site.coordinates}</td>
                <td className="py-4 px-4">
                  <div className="flex items-center justify-end space-x-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/sites/${site.id}`);
                      }}
                      className="p-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="View site details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditSite(site);
                      }}
                      className="p-1 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSite(site);
                      }}
                      className="p-1 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
