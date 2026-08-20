import React from 'react';
import { Database, Download, Archive, Trash2 } from 'lucide-react';

export function DataManagement() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Data & Export</h1>
        <p className="text-slate-600 mt-2">Manage your data exports and backups</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Data Management</h3>
        <div className="space-y-4">
          <div className="p-4 border border-slate-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Download className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-medium text-slate-900">Export Project Data</div>
                  <div className="text-sm text-slate-600">Download all project data as CSV or JSON</div>
                </div>
              </div>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
          
          <div className="p-4 border border-slate-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Archive className="w-5 h-5 text-emerald-600" />
                <div>
                  <div className="font-medium text-slate-900">Backup Data</div>
                  <div className="text-sm text-slate-600">Create a full backup of your organization's data</div>
                </div>
              </div>
              <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2">
                <Archive className="w-4 h-4" />
                <span>Backup</span>
              </button>
            </div>
          </div>
          
          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Trash2 className="w-5 h-5 text-red-600" />
                <div>
                  <div className="font-medium text-red-900">Delete Account</div>
                  <div className="text-sm text-red-700">Permanently delete your account and all data</div>
                </div>
              </div>
              <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2">
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
