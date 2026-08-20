import React from 'react';
import { X, Edit, Loader2 } from 'lucide-react';
import { ApiNursery } from '@services/api';
import { CreateNurseryFormData } from './types';

interface EditNurseryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  nursery: ApiNursery | null;
  formData: CreateNurseryFormData;
  onInputChange: (field: string, value: string) => void;
  isLoading: boolean;
}

export function EditNurseryModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  nursery, 
  formData, 
  onInputChange, 
  isLoading 
}: EditNurseryModalProps) {
  if (!isOpen || !nursery) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Edit Nursery</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nursery Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => onInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Enter nursery name"
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
                  <span>Update Nursery</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
