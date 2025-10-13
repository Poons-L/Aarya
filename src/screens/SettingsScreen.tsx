import { ArrowLeft, User, Bell, Lock, Download, HelpCircle, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { BottomNav } from '../components/BottomNav';

interface SettingsScreenProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

export function SettingsScreen({ onBack, onNavigate }: SettingsScreenProps) {
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };
  return (
    <div className="h-full bg-slate-50 flex flex-col">
      <div className="bg-white px-6 pt-14 pb-6 border-b border-slate-200">
        <div className="flex items-center mb-6">
          <button onClick={onBack} className="p-2 -ml-2 active:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-slate-700" />
          </button>
          <h1 className="text-xl font-bold text-slate-900 ml-4">Settings</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-400 rounded-full flex items-center justify-center text-white font-bold text-xl">
            {user?.email?.substring(0, 2).toUpperCase() || 'U'}
          </div>
          <div>
            <div className="font-bold text-slate-900">{user?.email?.split('@')[0] || 'User'}</div>
            <div className="text-sm text-slate-600">{user?.email || 'No email'}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        <div>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">
            Account
          </h2>
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
            <button className="w-full px-5 py-4 flex items-center justify-between active:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <User size={20} className="text-slate-600" />
                <span className="font-medium text-slate-900">Profile Information</span>
              </div>
              <ChevronRight size={20} className="text-slate-400" />
            </button>
            <div className="h-px bg-slate-100"></div>
            <button className="w-full px-5 py-4 flex items-center justify-between active:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <Lock size={20} className="text-slate-600" />
                <span className="font-medium text-slate-900">Privacy & Security</span>
              </div>
              <ChevronRight size={20} className="text-slate-400" />
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">
            Preferences
          </h2>
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
            <button className="w-full px-5 py-4 flex items-center justify-between active:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <Bell size={20} className="text-slate-600" />
                <span className="font-medium text-slate-900">Notifications</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Enabled</span>
                <ChevronRight size={20} className="text-slate-400" />
              </div>
            </button>
            <div className="h-px bg-slate-100"></div>
            <button className="w-full px-5 py-4 flex items-center justify-between active:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-medium text-slate-900">Contact Photos</span>
              </div>
              <ChevronRight size={20} className="text-slate-400" />
            </button>
            <div className="h-px bg-slate-100"></div>
            <button className="w-full px-5 py-4 flex items-center justify-between active:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <span className="font-medium text-slate-900">Voice Recording</span>
              </div>
              <ChevronRight size={20} className="text-slate-400" />
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">
            Data
          </h2>
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
            <button className="w-full px-5 py-4 flex items-center justify-between active:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <Download size={20} className="text-slate-600" />
                <span className="font-medium text-slate-900">Export Data</span>
              </div>
              <ChevronRight size={20} className="text-slate-400" />
            </button>
            <div className="h-px bg-slate-100"></div>
            <button className="w-full px-5 py-4 flex items-center justify-between active:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="font-medium text-slate-900">Import Contacts</span>
              </div>
              <ChevronRight size={20} className="text-slate-400" />
            </button>
            <div className="h-px bg-slate-100"></div>
            <button className="w-full px-5 py-4 flex items-center justify-between active:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                <span className="font-medium text-slate-900">Storage</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">2.4 GB</span>
                <ChevronRight size={20} className="text-slate-400" />
              </div>
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">
            Support
          </h2>
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
            <button className="w-full px-5 py-4 flex items-center justify-between active:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <HelpCircle size={20} className="text-slate-600" />
                <span className="font-medium text-slate-900">Help Center</span>
              </div>
              <ChevronRight size={20} className="text-slate-400" />
            </button>
            <div className="h-px bg-slate-100"></div>
            <button className="w-full px-5 py-4 flex items-center justify-between active:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="font-medium text-slate-900">Terms & Privacy</span>
              </div>
              <ChevronRight size={20} className="text-slate-400" />
            </button>
            <div className="h-px bg-slate-100"></div>
            <button className="w-full px-5 py-4 flex items-center justify-between active:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium text-slate-900">About</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">v1.0.0</span>
                <ChevronRight size={20} className="text-slate-400" />
              </div>
            </button>
          </div>
        </div>

        <div className="pb-6">
          <button
            onClick={handleLogout}
            className="w-full bg-red-50 text-red-600 font-semibold py-4 rounded-2xl border-2 border-red-200 active:bg-red-100 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </div>
      <BottomNav currentScreen="settings" onNavigate={onNavigate} />
    </div>
  );
}
