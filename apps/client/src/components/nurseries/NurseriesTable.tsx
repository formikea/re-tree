import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Eye, Edit, Trash2, Loader2, Building2 } from 'lucide-react';
import { ApiNursery } from '@services/api';

interface NurseriesTableProps {
  nurseries: ApiNursery[];
  isLoading: boolean;
  onEditNursery: (nursery: ApiNursery) => void;
  onDeleteNursery: (nursery: ApiNursery) => void;
}

export function NurseriesTable({ nurseries, isLoading, onEditNursery, onDeleteNursery }: NurseriesTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const filteredNurseries = nurseries.filter(nursery => {
    if (!nursery || !nursery.name) {
      console.warn('Invalid nursery data:', nursery);
      return false;
    }
    
    const matchesSearch = nursery.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <span className="ml-2 text-slate-600">Loading nurseries...</span>
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
              placeholder="Search nurseries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-64 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
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
              <th className="text-left py-3 px-4 font-medium text-slate-900">Nursery Name</th>
              <th className="text-left py-3 px-4 font-medium text-slate-900">ID</th>
              <th className="text-right py-3 px-4 font-medium text-slate-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredNurseries.map((nursery) => (
              <tr 
                key={nursery.id} 
                className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => navigate(`/nurseries/${nursery.id}`)}
              >
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">
                        {nursery.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-slate-900">{nursery.id}</td>
                <td className="py-4 px-4">
                  <div className="flex items-center justify-end space-x-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/nurseries/${nursery.id}`);
                      }}
                      className="p-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="View nursery details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditNursery(nursery);
                      }}
                      className="p-1 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteNursery(nursery);
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
