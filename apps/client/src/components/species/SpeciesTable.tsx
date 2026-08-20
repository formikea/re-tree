import React, { useState } from 'react';
import { Search, Filter, Eye, Edit, Trash2, Loader2, Leaf } from 'lucide-react';
import { ApiSpecies } from '@services/api';

interface SpeciesTableProps {
  species: ApiSpecies[];
  isLoading: boolean;
  onEditSpecies: (species: ApiSpecies) => void;
  onDeleteSpecies: (species: ApiSpecies) => void;
}

export function SpeciesTable({ species, isLoading, onEditSpecies, onDeleteSpecies }: SpeciesTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSpecies = species.filter(species => {
    if (!species || !species.botanicalName || !species.commonName) {
      console.warn('Invalid species data:', species);
      return false;
    }
    
    const matchesSearch = species.botanicalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         species.commonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (species.maoriName && species.maoriName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <span className="ml-2 text-slate-600">Loading species...</span>
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
              placeholder="Search species..."
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
              <th className="text-left py-3 px-4 font-medium text-slate-900">Species</th>
              <th className="text-left py-3 px-4 font-medium text-slate-900">Common Name</th>
              <th className="text-left py-3 px-4 font-medium text-slate-900">Māori Name</th>
              <th className="text-left py-3 px-4 font-medium text-slate-900">Status</th>
              <th className="text-left py-3 px-4 font-medium text-slate-900">Notes</th>
              <th className="text-right py-3 px-4 font-medium text-slate-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSpecies.map((species) => (
              <tr 
                key={species.id} 
                className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Leaf className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 italic">
                        {species.botanicalName}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-slate-900">{species.commonName}</td>
                <td className="py-4 px-4 text-slate-900">{species.maoriName || '-'}</td>
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-2">
                    {species.threatenedSpecies && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        Threatened
                      </span>
                    )}
                    {species.treesThatCount && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Trees That Count
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-4 px-4 text-slate-900 text-sm">{species.notes || '-'}</td>
                <td className="py-4 px-4">
                  <div className="flex items-center justify-end space-x-2">
                    <button 
                      onClick={() => onEditSpecies(species)}
                      className="p-1 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDeleteSpecies(species)}
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
