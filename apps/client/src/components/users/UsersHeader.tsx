import React from 'react';
import { Plus } from 'lucide-react';

interface UsersHeaderProps {
  onAddUser: () => void;
  canManage: boolean;
}

export function UsersHeader({ onAddUser, canManage }: UsersHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Users</h1>
        <p className="text-slate-600 mt-2">Manage your organization's users and permissions</p>
      </div>
      {canManage && (
        <button 
          onClick={onAddUser}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add User</span>
        </button>
      )}
    </div>
  );
}
