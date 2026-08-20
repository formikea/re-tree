import React from 'react';
import { Plus, Calendar, TreePine } from 'lucide-react';
import { SiteDetailGridProps } from './types';

export function SiteDetailGrid({
  species,
  seasons,
  batches,
  allAllotments,
  onCellClick,
  onOrderBatchClick,
  getAvailableQuantityForSpecies,
  getAllotmentQuantityForSpeciesSeason
}: SiteDetailGridProps) {
  if (species.length === 0 || seasons.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6">
          <div className="text-center py-8">
            <p className="text-slate-600">
              {species.length === 0 && seasons.length === 0 
                ? 'No species or seasons available'
                : species.length === 0 
                ? 'No species available' 
                : 'No seasons available for this site'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-4 border border-slate-200 bg-slate-50 font-medium text-slate-900 min-w-[200px]">
                  <div className="flex items-center space-x-2">
                    <TreePine className="w-4 h-4" />
                    <span>Species</span>
                  </div>
                </th>
                {seasons.map((season) => (
                  <th 
                    key={season.id} 
                    className="text-center p-4 border border-slate-200 bg-slate-50 font-medium text-slate-900 min-w-[120px]"
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <Calendar className="w-4 h-4" />
                      <span className="capitalize">{season.season}</span>
                      <span className="text-sm text-slate-600">{season.year}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {species.map((speciesItem) => (
                <tr key={speciesItem.id}>
                  <td className="p-4 border border-slate-200 bg-slate-50">
                    <div>
                      <div className="font-medium text-slate-900">
                        {speciesItem.commonName || speciesItem.botanicalName}
                      </div>
                      {speciesItem.commonName && speciesItem.botanicalName && (
                        <div className="text-sm text-slate-600 italic">
                          {speciesItem.botanicalName}
                        </div>
                      )}
                      {speciesItem.maoriName && (
                        <div className="text-sm text-emerald-600">
                          {speciesItem.maoriName}
                        </div>
                      )}
                    </div>
                  </td>
                  {seasons.map((season) => {
                    const availableQty = getAvailableQuantityForSpecies(speciesItem.id);
                    const existingQty = getAllotmentQuantityForSpeciesSeason(speciesItem.id, season.id);
                    const hasExistingAllotment = existingQty > 0;
                    
                    return (
                      <td 
                        key={`${speciesItem.id}-${season.id}`}
                        className="p-4 border border-slate-200 text-center"
                      >
                        {hasExistingAllotment ? (
                          // Show existing allotment with option to add more
                          <div className="w-full h-12 border rounded-lg bg-blue-50 border-blue-200 flex flex-col items-center justify-center relative">
                            <div className="text-sm font-medium text-blue-700">
                              {existingQty}
                            </div>
                            <div className="text-xs text-blue-600">
                              allocated
                            </div>
                            {availableQty > 0 && (
                              <button
                                onClick={() => onCellClick(speciesItem.id, season.id)}
                                className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 hover:bg-emerald-600 rounded-full flex items-center justify-center transition-colors"
                                title={`Add more (${availableQty} available)`}
                              >
                                <Plus className="w-3 h-3 text-white" />
                              </button>
                            )}
                          </div>
                        ) : (
                          // Show add button for new allotment or order button for none available
                          <button
                            onClick={() => availableQty > 0 ? onCellClick(speciesItem.id, season.id) : onOrderBatchClick(speciesItem.id, season.id)}
                            className={`w-full h-12 border rounded-lg transition-colors group flex flex-col items-center justify-center ${
                              availableQty > 0 
                                ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 cursor-pointer' 
                                : 'bg-gray-50 hover:bg-gray-100 border-gray-200 cursor-pointer'
                            }`}
                          >
                            <Plus className={`w-4 h-4 ${
                              availableQty > 0 
                                ? 'text-emerald-600 group-hover:text-emerald-700' 
                                : 'text-gray-500 group-hover:text-gray-600'
                            }`} />
                            <span className={`text-xs mt-1 ${
                              availableQty > 0 
                                ? 'text-emerald-600' 
                                : 'text-gray-500'
                            }`}>
                              {availableQty > 0 ? `${availableQty} avail` : 'Order'}
                            </span>
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
