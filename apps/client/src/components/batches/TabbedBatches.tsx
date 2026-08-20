import React from 'react';
import { Plus } from 'lucide-react';
import { BatchesTable } from './BatchesTable';
import { OrdersTable } from './OrdersTable';
import { TabbedBatchesProps, StageStyles, SpeciesStageMatrix } from './types';

interface ExtendedTabbedBatchesProps {
  activeTab: 'batches' | 'orders';
  onTabChange: (tab: 'batches' | 'orders') => void;
  species: any[];
  inventoryMatrix: SpeciesStageMatrix;
  inventoryStageOrder: readonly string[];
  ordersMatrix: SpeciesStageMatrix;
  ordersStageOrder: readonly string[];
  stageStyles: StageStyles;
  onEditBatch: (batch: any) => void;
  isUpdating: boolean;
  batches: any[];
  onShowCreateModal: () => void;
  onShowOrderModal: () => void;
}

export function TabbedBatches({ 
  activeTab, 
  onTabChange, 
  species,
  inventoryMatrix,
  inventoryStageOrder,
  ordersMatrix,
  ordersStageOrder,
  stageStyles,
  onEditBatch,
  isUpdating,
  batches,
  onShowCreateModal,
  onShowOrderModal
}: ExtendedTabbedBatchesProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="border-b border-slate-200">
        <div className="flex items-center justify-between px-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => onTabChange('batches')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'batches'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Inventory
            </button>
            <button
              onClick={() => onTabChange('orders')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'orders'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Orders
            </button>
          </nav>
          
          <div className="flex items-center space-x-3">
            {activeTab === 'batches' && (
              <button 
                onClick={onShowCreateModal}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Batch</span>
              </button>
            )}
            
            {activeTab === 'orders' && (
              <button 
                onClick={onShowOrderModal}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Order</span>
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {activeTab === 'batches' && (
          <BatchesTable 
            species={species}
            speciesStageMatrix={inventoryMatrix}
            stageOrder={inventoryStageOrder}
            stageStyles={stageStyles}
          />
        )}
        
        {activeTab === 'orders' && (
          <OrdersTable 
            species={species}
            speciesStageMatrix={ordersMatrix}
            stageOrder={ordersStageOrder}
            stageStyles={stageStyles}
            onEditBatch={onEditBatch}
            isUpdating={isUpdating}
            batches={batches}
          />
        )}
      </div>
    </div>
  );
}
