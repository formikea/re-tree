import React from 'react';
import { Leaf } from 'lucide-react';
import { SpeciesCardProps } from './types';

export function SpeciesCard({ 
  speciesData, 
  quantity, 
  onQuantityChange, 
  stageStyles 
}: SpeciesCardProps) {
  return (
    <div className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
      <div className="flex items-center justify-between">
        {/* Species Info */}
        <div className="flex items-center space-x-4 flex-1">
          <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
            <Leaf className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-slate-900">{speciesData.species.commonName}</h4>
            <p className="text-sm text-slate-600 italic">{speciesData.species.botanicalName}</p>
            
            {/* Stage Availability */}
            <div className="flex items-center space-x-4 mt-2">
              {Object.entries(speciesData.stages).map(([stage, stageQuantity]) => (
                stageQuantity > 0 && (
                  <div key={stage} className="flex items-center space-x-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${stageStyles[stage as keyof typeof stageStyles]}`}>
                      {stage}
                    </span>
                    <span className="text-sm text-slate-600">{stageQuantity.toLocaleString()}</span>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>

        {/* Total Available */}
        <div className="text-right mr-4">
          <div className="font-medium text-slate-900">{speciesData.total.toLocaleString()}</div>
          <div className="text-sm text-slate-600">total available</div>
        </div>

        {/* Quantity Input */}
        <div className="w-32">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Quantity
          </label>
          <input
            type="number"
            min="0"
            max={speciesData.total}
            value={quantity}
            onChange={(e) => onQuantityChange(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="0"
          />
        </div>
      </div>
    </div>
  );
} 