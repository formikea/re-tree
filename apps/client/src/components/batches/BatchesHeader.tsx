import React from 'react';

export function BatchesHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Plants</h1>
        <p className="text-slate-600 mt-2">View batch quantities by species and growing stage</p>
      </div>
    </div>
  );
}
