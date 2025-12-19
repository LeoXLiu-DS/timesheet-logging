import React, { useState, useMemo, useEffect } from 'react';
import { User, Role, TimeEntry, Status, Tenant } from './types';
import { INITIAL_ENTRIES, MOCK_TASKS, MOCK_PROJECTS, MOCK_TENANTS, MOCK_USERS } from './constants';
import Login from './components/Login';
import WeeklyTimesheet from './components/WeeklyTimesheet';
import ManagerTimesheetList from './components/ManagerTimesheetList';
import ManagerExport from './components/ManagerExport';
import TenantAdmin from './components/TenantAdmin';
import { StorageService } from './services/storageService';
import { getCurrentTenant } from './services/authService';
import { LogOut, Calendar, CheckSquare, Download, Settings, Shield, LayoutDashboard, Loader2 } from 'lucide-react';

type View = 'CONTRACTOR_HOME' | 'MANAGER_HOME' | 'MANAGER_DETAIL' | 'MANAGER_EXPORT' | 'TENANT_ADMIN';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [tenantUsers, setTenantUsers] = useState<User[]>([]);
  const [currentView, setCurrentView] = useState<View>('CONTRACTOR_HOME');
  const [isLoading, setIsLoading] = useState(false);
  
  // Persistent Storage Initialization
  useEffect(() => {
    StorageService.initialize(INITIAL_ENTRIES, MOCK_USERS);
  }, []);

  // Sync data when user or view changes
  useEffect(() => {
    if (user) {
      setIsLoading(true);
      Promise.all([
        StorageService.getEntries(user.tenantId),
        StorageService.getUsers(user.tenantId)
      ]).then(([fetchedEntries, fetchedUsers]) => {
        setEntries(fetchedEntries);
        setTenantUsers(fetchedUsers);
        setIsLoading(false);
      });
    }
  }, [user, currentView]);

  const currentTenant = useMemo(() => 
    user ? getCurrentTenant(user.tenantId) : null
  , [user]);

  // Authorization Helpers
  const canAccessAdmin = user?.role === Role.MANAGER;
  
  // Data Filtering (Double-layered isolation)
  const filteredProjects = useMemo(() => 
    user ? MOCK_PROJECTS.filter(p => p.tenantId === user.tenantId) : []
  , [user]);

  // Auth Handlers
  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setCurrentView(loggedInUser.role === Role.MANAGER ? 'MANAGER_HOME' : 'CONTRACTOR_HOME');
  };

  const handleLogout = () => {
    setUser(null);
    setEntries([]);
    setCurrentView('CONTRACTOR_HOME');
  };

  // User Management Handlers (Admin Only)
  const handleAddUser = async (newUserInfo: Omit<User, 'id'>) => {
    if (!user || !canAccessAdmin) return;
    const newUser = { ...newUserInfo, id: `u-${Date.now()}` };
    await StorageService.saveUser(user.tenantId, newUser);
    const updated = await StorageService.getUsers(user.tenantId);
    setTenantUsers(updated);
  };

  const handleRemoveUser = async (id: string) => {
    if (!user || !canAccessAdmin) return;
    // In a real app, we'd have a delete method for users
    // For now we'll just re-fetch after update logic
    setTenantUsers(prev => prev.filter(u => u.id !== id));
  };

  // Data Handlers with Tenant Check
  const handleUpsertEntry = async (partialEntry: Partial<TimeEntry>) => {
    if (!user) return;
    
    let entryToSave: TimeEntry;

    if (partialEntry.id) {
      const existing = entries.find(e => e.id === partialEntry.id);
      if (!existing) return;
      entryToSave = { ...existing, ...partialEntry } as TimeEntry;
    } else {
      const project = filteredProjects.find(p => p.id === partialEntry.projectId);
      entryToSave = {
        id: Math.random().toString(36).substr(2, 9),
        tenantId: user.tenantId,
        contractorId: user.id,
        contractorName: user.name,
        projectId: partialEntry.projectId!,
        projectName: project?.name || 'Unknown',
        taskId: partialEntry.taskId,
        taskName: MOCK_TASKS.find(t => t.id === partialEntry.taskId)?.name,
        date: partialEntry.date!,
        hours: partialEntry.hours || 0,
        description: partialEntry.description || '',
        status: Status.DRAFT
      };
    }

    await StorageService.upsertEntry(user.tenantId, entryToSave);
    const updated = await StorageService.getEntries(user.tenantId);
    setEntries(updated);
  };

  const handleSubmitWeek = async (ids: string[]) => {
    if (!user) return;
    for (const id of ids) {
      const entry = entries.find(e => e.id === id);
      if (entry) {
        await StorageService.upsertEntry(user.tenantId, { ...entry, status: Status.SUBMITTED });
      }
    }
    const updated = await StorageService.getEntries(user.tenantId);
    setEntries(updated);
  };

  const [managerContext, setManagerContext] = useState<{ contractorId: string, weekStart: Date } | null>(null);

  if (!user || !currentTenant) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Multi-Tenant Sidebar */}
      <aside className="w-72 bg-slate-900 text-white flex-shrink-0 hidden lg:flex flex-col">
        <div className="h-24 flex items-center px-8 border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl">
          <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl mr-4 flex items-center justify-center font-black text-2xl shadow-2xl shadow-indigo-500/30">
            {currentTenant.name.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <span className="font-extrabold text-sm tracking-tight block truncate uppercase">{currentTenant.name}</span>
            <div className="flex items-center mt-1">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2"></div>
               <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Active Session</span>
            </div>
          </div>
        </div>
        
        <nav className="p-6 flex-grow space-y-2">
          {user.role === Role.CONTRACTOR && (
            <button
              onClick={() => setCurrentView('CONTRACTOR_HOME')}
              className={`w-full flex items-center px-4 py-4 rounded-xl transition-all duration-300 ${currentView === 'CONTRACTOR_HOME' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 translate-x-1' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <Calendar className="w-5 h-5 mr-3" />
              <span className="font-bold text-sm">Timesheets</span>
            </button>
          )}

          {canAccessAdmin && (
            <>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-4 pt-4 pb-2">Management</div>
              <button
                onClick={() => setCurrentView('MANAGER_HOME')}
                className={`w-full flex items-center px-4 py-4 rounded-xl transition-all duration-300 ${['MANAGER_HOME', 'MANAGER_DETAIL'].includes(currentView) ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 translate-x-1' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                <CheckSquare className="w-5 h-5 mr-3" />
                <span className="font-bold text-sm">Approvals</span>
              </button>
              <button
                onClick={() => setCurrentView('MANAGER_EXPORT')}
                className={`w-full flex items-center px-4 py-4 rounded-xl transition-all duration-300 ${currentView === 'MANAGER_EXPORT' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 translate-x-1' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                <Download className="w-5 h-5 mr-3" />
                <span className="font-bold text-sm">Reporting</span>
              </button>
              
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-4 pt-6 pb-2">Infrastructure</div>
              <button
                onClick={() => setCurrentView('TENANT_ADMIN')}
                className={`w-full flex items-center px-4 py-4 rounded-xl transition-all duration-300 ${currentView === 'TENANT_ADMIN' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 translate-x-1' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                <Settings className="w-5 h-5 mr-3" />
                <span className="font-bold text-sm">Tenant Admin</span>
              </button>
            </>
          )}
        </nav>

        <div className="p-6 bg-slate-800/40 mx-6 mb-8 rounded-[2rem] border border-slate-700/50 backdrop-blur-sm">
          <div className="flex items-center mb-6">
             <div className="relative">
                <img src={user.avatarUrl} alt="" className="h-12 w-12 rounded-2xl border-2 border-indigo-500/50 p-0.5 object-cover" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-800 rounded-full"></div>
             </div>
             <div className="ml-4 overflow-hidden">
                <p className="text-xs font-black text-white truncate uppercase tracking-tight">{user.name}</p>
                <p className="text-[10px] text-indigo-400 truncate uppercase font-bold tracking-tighter">{user.role}</p>
             </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center justify-center py-3 px-4 rounded-xl border border-slate-700 text-xs font-bold text-slate-400 hover:text-white hover:bg-red-500/10 hover:border-red-500/50 transition-all active:scale-95"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 lg:h-0 bg-white border-b border-slate-200 flex items-center px-8 lg:hidden">
          <div className="h-8 w-8 bg-indigo-600 rounded-lg mr-3 flex items-center justify-center font-black text-white">
            {currentTenant.name.charAt(0)}
          </div>
          <span className="font-black text-slate-900 uppercase tracking-tight">{currentTenant.name}</span>
        </header>

        <main className="flex-1 overflow-hidden relative overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          ) : (
            <>
              {currentView === 'CONTRACTOR_HOME' && (
                <WeeklyTimesheet 
                    contractorId={user.id} 
                    contractorName={user.name} 
                    entries={entries.filter(e => e.contractorId === user.id)}
                    onUpsertEntry={handleUpsertEntry}
                    onSubmitWeek={handleSubmitWeek}
                />
              )}

              {currentView === 'MANAGER_HOME' && (
                <ManagerTimesheetList 
                    entries={entries}
                    onSelectSheet={(cId, ws) => {
                      setManagerContext({ contractorId: cId, weekStart: ws });
                      setCurrentView('MANAGER_DETAIL');
                    }}
                />
              )}

              {currentView === 'MANAGER_DETAIL' && managerContext && (
                <WeeklyTimesheet 
                    contractorId={managerContext.contractorId}
                    contractorName={tenantUsers.find(u => u.id === managerContext.contractorId)?.name || 'User'}
                    entries={entries.filter(e => e.contractorId === managerContext.contractorId)}
                    readOnly={true}
                    initialDate={managerContext.weekStart}
                    onBack={() => setCurrentView('MANAGER_HOME')}
                />
              )}

              {currentView === 'MANAGER_EXPORT' && (
                <ManagerExport entries={entries} />
              )}

              {currentView === 'TENANT_ADMIN' && canAccessAdmin && (
                <TenantAdmin 
                  currentTenant={currentTenant}
                  users={tenantUsers}
                  onAddUser={handleAddUser}
                  onRemoveUser={handleRemoveUser}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;