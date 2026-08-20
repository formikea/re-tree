import React from 'react';
import { ErrorDisplayProps } from './types';

export function ErrorDisplay({ error, title = 'Error' }: ErrorDisplayProps) {
  const errorMessage = error instanceof Error ? error.message : error;
  
  return (
    <div className="space-y-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h2 className="text-red-800 font-semibold mb-2">{title}</h2>
        <p className="text-red-700 mb-4">{errorMessage}</p>
      </div>
    </div>
  );
} 