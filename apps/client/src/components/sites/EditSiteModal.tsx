import React from 'react';
import { X, Edit, Loader2 } from 'lucide-react';
import { ApiSite } from '@services/api';
import { CreateSiteFormData } from './types';

interface EditSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  site: ApiSite | null;
  formData: CreateSiteFormData;
  onInputChange: (field: string, value: string) => void;
  isLoading: boolean;
}

export function EditSiteModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  site, 
  formData, 
  onInputChange, 
  isLoading 
}: EditSiteModalProps) {
  if (!isOpen || !site) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Edit Site</h2>
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
                Site Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => onInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Enter site name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Region *
              </label>
              <input
                type="text"
                required
                value={formData.region}
                onChange={(e) => onInputChange('region', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="e.g., Auckland"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Coordinates *
              </label>
              <input
                type="text"
                required
                value={formData.coordinates}
                onChange={(e) => onInputChange('coordinates', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="e.g., -36.8485, 174.7633"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Area (hectares) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.1"
                value={formData.area}
                onChange={(e) => onInputChange('area', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="e.g., 16000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Owner *
              </label>
              <input
                type="text"
                required
                value={formData.owner}
                onChange={(e) => onInputChange('owner', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="e.g., Auckland Council"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Site Type *
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) => onInputChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="Regional Park">Regional Park</option>
                <option value="Scientific Reserve">Scientific Reserve</option>
                <option value="Conservation Area">Conservation Area</option>
                <option value="Private Land">Private Land</option>
              </select>
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
              placeholder="Additional notes about the site..."
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
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4" />
                  <span>Update Site</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
