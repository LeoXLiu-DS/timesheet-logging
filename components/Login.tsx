import React, { useState } from 'react';
import { signInWithAzure } from '../services/authService';
import { ShieldCheck, Loader2 } from 'lucide-react';

const Login: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAzureLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      await signInWithAzure();
      // Redirect happens automatically - no need to handle success here
    } catch (err) {
      setError('Failed to initiate sign-in. Please try again.');
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
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
              <p className="text-sm font-semibold text-slate-600">
                Redirecting to Microsoft...
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <p className="text-slate-600 text-sm">
                  Sign in with your company Microsoft account to access the timesheet system.
                </p>
              </div>

              <button
                onClick={handleAzureLogin}
                className="w-full flex items-center justify-center px-6 py-4 border border-transparent text-md font-bold rounded-xl text-white bg-[#0078d4] hover:bg-[#106ebe] shadow-xl shadow-blue-600/20 transition-all active:scale-95"
              >
                <svg
                  className="w-5 h-5 mr-3"
                  viewBox="0 0 21 21"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="10" height="10" fill="#f25022" />
                  <rect x="11" width="10" height="10" fill="#7fba00" />
                  <rect y="11" width="10" height="10" fill="#00a4ef" />
                  <rect x="11" y="11" width="10" height="10" fill="#ffb900" />
                </svg>
                Sign in with Microsoft
              </button>

              <div className="mt-6 pt-6 border-t border-slate-100">
                <p className="text-xs text-slate-400 text-center">
                  Only users with authorized company email domains can access this application.
                </p>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-50">
            <div className="flex items-center justify-center text-[10px] text-slate-400 font-medium">
              <ShieldCheck className="w-3 h-3 mr-1 text-emerald-500" />
              Secured by Microsoft Entra ID + AWS Cognito
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-slate-400 leading-relaxed px-12">
          Your organization's security policies apply. Contact your IT administrator if you have trouble signing in.
        </p>
      </div>
    </div>
  );
};

export default Login;
