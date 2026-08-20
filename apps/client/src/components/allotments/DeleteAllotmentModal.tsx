import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { DeleteAllotmentModalProps } from './types';

export function DeleteAllotmentModal({
  isOpen,
  onClose,
  allotmentToDelete,
  onConfirmDelete,
  isDeleting
}: DeleteAllotmentModalProps) {
  if (!isOpen || !allotmentToDelete) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Delete Allotment</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <X className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-medium text-slate-900">Confirm Deletion</h3>
                <p className="text-sm text-slate-600">This action cannot be undone.</p>
              </div>
            </div>
            
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-slate-700 mb-2">
                Are you sure you want to delete the allotment for:
              </p>
              <div className="font-medium text-slate-900">
                {allotmentToDelete.speciesName}
              </div>
              <div className="text-sm text-slate-600">
                Quantity: {allotmentToDelete.quantity.toLocaleString()} plants
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirmDelete}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <X className="w-4 h-4" />
              )}
              <span>{isDeleting ? 'Deleting...' : 'Delete Allotment'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 