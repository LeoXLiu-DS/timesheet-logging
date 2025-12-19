import React, { useState } from 'react';
import { User, Role, Tenant } from '../types';
import { UserPlus, Shield, User as UserIcon, Trash2, Mail } from 'lucide-react';

interface TenantAdminProps {
  currentTenant: Tenant;
  users: User[];
  onAddUser: (user: Omit<User, 'id'>) => void;
  onRemoveUser: (id: string) => void;
}

const TenantAdmin: React.FC<TenantAdminProps> = ({ currentTenant, users, onAddUser, onRemoveUser }) => {
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<Role>(Role.CONTRACTOR);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;
    onAddUser({
      tenantId: currentTenant.id,
      name: newName,
      email: newEmail,
      role: newRole,
      avatarUrl: `https://i.pravatar.cc/150?u=${newEmail}`
    });
    setNewName('');
    setNewEmail('');
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Tenant Administration</h1>
        <p className="text-slate-500">Manage access and roles for <span className="font-semibold text-blue-600">{currentTenant.name}</span></p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add User Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <UserPlus className="w-5 h-5 mr-2 text-blue-600" />
              Provision User
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full border-slate-300 rounded-md shadow-sm p-2 border text-sm"
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Company Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full border-slate-300 rounded-md shadow-sm p-2 border text-sm"
                  placeholder="jane@company.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Access Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as Role)}
                  className="w-full border-slate-300 rounded-md shadow-sm p-2 border text-sm"
                >
                  <option value={Role.CONTRACTOR}>Contractor</option>
                  <option value={Role.MANAGER}>Manager (Admin)</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white font-bold py-2 rounded-md hover:bg-blue-700 transition-colors shadow-sm text-sm"
              >
                Create Account
              </button>
            </form>
          </div>
        </div>

        {/* User List */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Active Directory Sync (Simulated)</h3>
            </div>
            <ul className="divide-y divide-slate-100">
              {users.map((user) => (
                <li key={user.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center">
                    <img src={user.avatarUrl} alt="" className="h-10 w-10 rounded-full border border-slate-200 mr-4" />
                    <div>
                      <p className="text-sm font-bold text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500 flex items-center">
                        <Mail className="w-3 h-3 mr-1" /> {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tighter ${user.role === Role.MANAGER ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                      {user.role}
                    </span>
                    <button
                      onClick={() => onRemoveUser(user.id)}
                      className="text-slate-300 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantAdmin;