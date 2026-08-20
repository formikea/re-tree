import React, { useState, useEffect } from 'react';
import { X, Plus, Loader2, Check } from 'lucide-react';
import { EditBatchModalProps } from './types';

export function EditBatchModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  onCompleteOrder,
  batch, 
  species, 
  nurseries, 
  isLoading 
}: EditBatchModalProps) {
  const [formData, setFormData] = useState({
    speciesId: batch?.speciesId || 0,
    nurseryId: batch?.nurseryId || 0,
    origin: batch?.origin || '',
    quantity: batch?.quantity || 0,
    stage: batch?.stage || 'seed',
    notes: batch?.notes || ''
  });

  // Update form data when batch changes
  useEffect(() => {
    if (batch) {
      setFormData({
        speciesId: batch.speciesId,
        nurseryId: batch.nurseryId,
        origin: batch.origin || '',
        quantity: batch.quantity || 0,
        stage: batch.stage || 'seed',
        notes: batch.notes || ''
      });
    }
  }, [batch]);

  if (!isOpen || !batch) return null;

  const isOrder = batch.isOrder;

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCompleteOrder = () => {
    if (onCompleteOrder) {
      onCompleteOrder(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">
            {isOrder ? 'Edit Order' : 'Edit Batch'}
          </h2>
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
                Species *
              </label>
              <select
                required
                name="speciesId"
                value={formData.speciesId}
                onChange={(e) => handleInputChange('speciesId', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                {species.map((spec) => (
                  <option key={spec.id} value={spec.id}>
                    {spec.commonName} ({spec.botanicalName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nursery *
              </label>
              <select
                required
                name="nurseryId"
                value={formData.nurseryId}
                onChange={(e) => handleInputChange('nurseryId', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                {nurseries.map((nursery) => (
                  <option key={nursery.id} value={nursery.id}>
                    {nursery.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Origin
              </label>
              <input
                type="text"
                name="origin"
                value={formData.origin || ''}
                onChange={(e) => handleInputChange('origin', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="e.g., Local collection, Seed bank (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Quantity *
              </label>
              <input
                type="number"
                required
                min="1"
                name="quantity"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="e.g., 1000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Stage *
              </label>
              <select
                required
                name="stage"
                value={formData.stage}
                onChange={(e) => handleInputChange('stage', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="seed">Seed</option>
                <option value="prick">Prick</option>
                <option value="pot">Pot</option>
                <option value="plant">Plant</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Additional notes about this batch..."
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
            
            {isOrder && onCompleteOrder && (
              <button
                type="button"
                onClick={handleCompleteOrder}
                disabled={isLoading}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Completing...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Complete Order</span>
                  </>
                )}
              </button>
            )}
            
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
                  <Plus className="w-4 h-4" />
                  <span>{isOrder ? 'Update Order' : 'Update Batch'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
