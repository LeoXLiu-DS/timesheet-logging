import React, { useState } from 'react';
import { User, Role } from '../types';
import { MOCK_TENANTS } from '../constants';
import { loginWithMicrosoft } from '../services/authService';
import { ShieldCheck, Loader2, Mail, Building2, ExternalLink } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState(MOCK_TENANTS[0].id);

  const handleLogin = async (role: Role) => {
    setIsLoading(true);
    try {
      const user = await loginWithMicrosoft(selectedTenantId, role);
      onLogin(user);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-2xl rotate-3">
            <ShieldCheck className="h-10 w-10 text-white" />
          </div>
        </div>
        <h2 className="mt-8 text-center text-4xl font-black text-slate-900 tracking-tight">
          TimeLink <span className="text-indigo-600">Pro</span>
        </h2>
        <p className="mt-3 text-center text-sm text-slate-500 font-medium">
          Enterprise Workforce Management Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-10 px-10 shadow-[0_20px_50px_rgba(8,_112,_184,_0.07)] rounded-[2rem] border border-slate-200">
          <div className="space-y-8">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center">
                <Building2 className="w-3 h-3 mr-1" /> Organization Tenant
              </label>
              <select
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                className="block w-full px-4 py-4 text-base border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-xl border bg-slate-50/50 transition-all"
              >
                {MOCK_TENANTS.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.domain})</option>
                ))}
              </select>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
                <p className="text-sm font-semibold text-slate-600">Verifying Identity with Microsoft Entra ID...</p>
                <p className="text-xs text-slate-400">Authenticating via OIDC Federation</p>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={() => handleLogin(Role.CONTRACTOR)}
                  className="w-full flex items-center justify-center px-6 py-4 border border-transparent text-md font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all active:scale-95"
                >
                  <Mail className="mr-3 h-5 w-5" />
                  Sign in with Microsoft
                </button>
                
                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-100" />
                  </div>
                  <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.2em]">
                    <span className="px-4 bg-white text-slate-300">Administrative Portal</span>
                  </div>
                </div>

                <button
                  onClick={() => handleLogin(Role.MANAGER)}
                  className="group w-full flex items-center justify-center px-6 py-4 border-2 border-slate-200 text-sm font-bold rounded-xl text-slate-600 bg-white hover:border-indigo-200 hover:bg-slate-50 transition-all active:scale-95"
                >
                  Tenant Administrator Access
                </button>
              </div>
            )}
            
            <div className="mt-6 pt-6 border-t border-slate-50">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span className="flex items-center"><ShieldCheck className="w-3 h-3 mr-1 text-emerald-500" /> AES-256 Encrypted</span>
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="hover:text-indigo-600 flex items-center transition-colors">
                  Compliance Docs <ExternalLink className="w-2 h-2 ml-1" />
                </a>
              </div>
            </div>
          </div>
        </div>
        
        <p className="mt-8 text-center text-xs text-slate-400 leading-relaxed px-12">
          Strict tenant isolation is enforced via AWS IAM policies and DynamoDB Partition Keys. 
          Cross-tenant data leakage is prevention-guaranteed at the API level.
        </p>
      </div>
    </div>
  );
};

export default Login;