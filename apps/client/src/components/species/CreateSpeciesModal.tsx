import React from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { CreateSpeciesFormData } from './types';

interface CreateSpeciesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: CreateSpeciesFormData;
  onInputChange: (field: string, value: string | boolean) => void;
  isLoading: boolean;
}

export function CreateSpeciesModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  formData, 
  onInputChange, 
  isLoading 
}: CreateSpeciesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Add New Species</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Botanical Name *
              </label>
              <input
                type="text"
                required
                value={formData.botanicalName}
                onChange={(e) => onInputChange('botanicalName', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="e.g., Metrosideros excelsa"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Common Name *
              </label>
              <input
                type="text"
                required
                value={formData.commonName}
                onChange={(e) => onInputChange('commonName', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="e.g., Pōhutukawa"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Māori Name
              </label>
              <input
                type="text"
                value={formData.maoriName}
                onChange={(e) => onInputChange('maoriName', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="e.g., Pōhutukawa"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="threatenedSpecies"
                checked={formData.threatenedSpecies}
                onChange={(e) => onInputChange('threatenedSpecies', e.target.checked)}
                className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
              />
              <label htmlFor="threatenedSpecies" className="text-sm font-medium text-slate-700">
                Threatened Species
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="treesThatCount"
                checked={formData.treesThatCount}
                onChange={(e) => onInputChange('treesThatCount', e.target.checked)}
                className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
              />
              <label htmlFor="treesThatCount" className="text-sm font-medium text-slate-700">
                Trees That Count
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => onInputChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Additional notes about the species..."
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add Species</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
