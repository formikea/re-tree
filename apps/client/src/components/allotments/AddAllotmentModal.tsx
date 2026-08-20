import React from 'react';
import { X, Search, Package, Check, Loader2 } from 'lucide-react';
import { AddAllotmentModalProps } from './types';
import { SpeciesCard } from './SpeciesCard';

export function AddAllotmentModal({
  isOpen,
  onClose,
  availableSpecies,
  speciesQuantities,
  searchTerm,
  onSearchChange,
  onQuantityChange,
  onCreateAllotment,
  isCreating,
  stageStyles
}: AddAllotmentModalProps) {
  if (!isOpen) return null;

  const filteredSpecies = availableSpecies.filter(speciesData => 
    speciesData.species.commonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    speciesData.species.botanicalName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasSelectedSpecies = Object.entries(speciesQuantities).some(([, quantity]) => quantity > 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Create Plant Allotment</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-4">Select Species and Quantities</h3>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search species..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {availableSpecies.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">No species available.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSpecies.map((speciesData) => (
                    <SpeciesCard
                      key={speciesData.species.id}
                      speciesData={speciesData}
                      quantity={speciesQuantities[speciesData.species.id] || 0}
                      onQuantityChange={(quantity) => onQuantityChange(speciesData.species.id, quantity)}
                      stageStyles={stageStyles}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Summary of selected species */}
            {hasSelectedSpecies && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <h4 className="font-medium text-slate-900 mb-3">Summary</h4>
                <div className="space-y-2">
                  {Object.entries(speciesQuantities)
                    .filter(([, quantity]) => quantity > 0)
                    .map(([speciesId, quantity]) => {
                      const species = availableSpecies.find(s => s.species.id === parseInt(speciesId));
                      return species ? (
                        <div key={speciesId} className="flex items-center justify-between">
                          <span className="text-slate-700">{species.species.commonName}</span>
                          <span className="font-medium text-emerald-700">{quantity.toLocaleString()} plants</span>
                        </div>
                      ) : null;
                    })}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onCreateAllotment}
              disabled={!hasSelectedSpecies || isCreating}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>{isCreating ? 'Creating...' : 'Create Allotments'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 