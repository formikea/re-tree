import React from 'react';

interface ErrorDisplayProps {
  error: Error | null;
}

export function ErrorDisplay({ error }: ErrorDisplayProps) {
  if (!error) return null;

  return (
    <div className="space-y-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h2 className="text-red-800 font-semibold mb-2">Error</h2>
        <p className="text-red-700 mb-4">{error instanceof Error ? error.message : 'Failed to load site data'}</p>
      </div>
    </div>
  );
}
