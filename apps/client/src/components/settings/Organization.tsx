import React from 'react';
import { Globe } from 'lucide-react';
import { useAuth } from '@hooks/useAuth';
import { isAdminUser, isCoordinator, getCurrentOrganizationName } from '@utils/organization';

export function Organization() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Organization</h1>
        <p className="text-slate-600 mt-2">Manage your organization settings and preferences</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Organization Settings</h3>
        {isAdminUser(user) || isCoordinator(user) ? (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Organization Name</label>
              <input
                type="text"
                defaultValue={getCurrentOrganizationName(user) || ''}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Organization Type</label>
              <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                <option>Non-profit Organization</option>
                <option>Government Agency</option>
                <option>Private Company</option>
                <option>Research Institution</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Primary Location</label>
              <input
                type="text"
                defaultValue="Portland, Oregon, USA"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div className="pt-4">
              <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg transition-colors">
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Globe className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">You don't have permission to edit organization settings</p>
            <p className="text-sm text-slate-400">Contact your administrator for changes</p>
          </div>
        )}
      </div>
    </div>
  );
}
