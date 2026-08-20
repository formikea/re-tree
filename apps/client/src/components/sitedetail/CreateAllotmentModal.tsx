import React from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { CreateAllotmentModalProps } from './types';

export function CreateAllotmentModal({
  isOpen,
  onClose,
  onSubmit,
  selectedCell,
  quantity,
  onQuantityChange,
  species,
  seasons,
  isLoading
}: CreateAllotmentModalProps) {
  if (!isOpen || !selectedCell) return null;

  const getSelectedSpecies = () => {
    return species.find(s => s.id === selectedCell.speciesId);
  };

  const getSelectedSeason = () => {
    return seasons.find(s => s.id === selectedCell.seasonId);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Create Allotment</h2>
          
          <div className="space-y-4 mb-6">
            <div>
              <h3 className="font-medium text-slate-900 mb-2">Species</h3>
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="font-medium text-slate-900">
                  {getSelectedSpecies()?.commonName || getSelectedSpecies()?.botanicalName}
                </div>
                {getSelectedSpecies()?.commonName && getSelectedSpecies()?.botanicalName && (
                  <div className="text-sm text-slate-600 italic">
                    {getSelectedSpecies()?.botanicalName}
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-slate-900 mb-2">Season</h3>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="capitalize">{getSelectedSeason()?.season} {getSelectedSeason()?.year}</span>
              </div>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Quantity *
              </label>
              <input
                type="number"
                required
                min="1"
                value={quantity}
                onChange={(e) => onQuantityChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Enter quantity"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !quantity}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Create Allotment</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
