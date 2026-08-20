import React from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { CreateOrderBatchModalProps } from './types';

export function CreateOrderBatchModal({
  isOpen,
  onClose,
  onSubmit,
  selectedCell,
  formData,
  onFormChange,
  species,
  seasons,
  nurseries,
  isLoading
}: CreateOrderBatchModalProps) {
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
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Order New Batch</h2>
          
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nursery *
                </label>
                <select
                  required
                  value={formData.nurseryId}
                  onChange={(e) => onFormChange('nurseryId', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select nursery</option>
                  {nurseries.map((nursery) => (
                    <option key={nursery.id} value={nursery.id}>
                      {nursery.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Stage *
                </label>
                <select
                  required
                  value={formData.stage}
                  onChange={(e) => onFormChange('stage', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="seed">Seed</option>
                  <option value="prick">Prick</option>
                  <option value="pot">Pot</option>
                  <option value="plant">Plant</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Batch Quantity *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.quantity || ''}
                  onChange={(e) => onFormChange('quantity', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Total to order"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Allot Quantity *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={formData.quantity || 1}
                  value={formData.allotmentQuantity || ''}
                  onChange={(e) => onFormChange('allotmentQuantity', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="For this season"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => onFormChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Optional notes about this order..."
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
                disabled={isLoading || !formData.quantity || !formData.allotmentQuantity || !formData.nurseryId}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Order...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Create Order</span>
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
