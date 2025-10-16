import { ArrowLeft, User, Bell, Lock, Download, HelpCircle, LogOut, ChevronRight, FileJson, FileSpreadsheet, Calendar } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BottomNav } from '../components/BottomNav';
import { useMemories } from '../hooks/useMemories';
import { useContacts } from '../hooks/useContacts';
import { useReminders } from '../hooks/useReminders';
import { exportToJSON, exportToCSV } from '../utils/export';
import { seedDemoData } from '../utils/demoSeeder';

interface SettingsScreenProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

export function SettingsScreen({ onBack, onNavigate }: SettingsScreenProps) {
  const { user, signOut } = useAuth();
  const { memories } = useMemories();
  const { contacts } = useContacts();
  const { reminders } = useReminders();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const handleSeedDemo = async () => {
    if (!confirm('This will add sample contacts, memories, and reminders to your account. Continue?')) {
      return;
    }

    setSeeding(true);
    const result = await seedDemoData();
    if (result.success) {
      alert(`Demo data added! ${result.counts?.contacts} contacts, ${result.counts?.memories} memories, ${result.counts?.reminders} reminders`);
      window.location.reload();
    } else {
      alert(`Failed to seed data: ${result.message}`);
    }
    setSeeding(false);
  };

  const handleLogout = async () => {
    await signOut();
  };

  const handleExport = async (format: 'json' | 'csv') => {
    setExporting(true);
    try {
      const exportData = {
        memories,
        contacts,
        reminders,
        exportedAt: new Date().toISOString(),
        version: '1.1.0',
      };

      if (format === 'json') {
        exportToJSON(exportData);
      } else {
        exportToCSV(exportData);
      }

      setShowExportMenu(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };
  return (
    <div className="h-full bg-slate-50 flex flex-col">
      <div className="bg-white px-6 pt-14 pb-6 border-b border-slate-200">
        <div className="flex items-center mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-700" />
            <span className="font-medium text-slate-700">Back</span>
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
            More
          </h2>
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
            <button
              onClick={() => onNavigate('events-agenda')}
              className="w-full px-5 py-4 flex items-center justify-between active:bg-slate-50 transition-colors relative"
            >
              <div className="flex items-center gap-3">
                <Calendar size={20} className="text-slate-600" />
                <span className="font-medium text-slate-900">Events & Agenda</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                  PREVIEW
                </span>
                <ChevronRight size={20} className="text-slate-400" />
              </div>
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">
            Data
          </h2>
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="w-full px-5 py-4 flex items-center justify-between active:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Download size={20} className="text-slate-600" />
                <span className="font-medium text-slate-900">Export Data</span>
              </div>
              <ChevronRight size={20} className="text-slate-400" />
            </button>
            {showExportMenu && (
              <div className="px-5 py-3 bg-slate-50 space-y-2">
                <button
                  onClick={() => handleExport('json')}
                  disabled={exporting}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-white rounded-xl border-2 border-slate-200 active:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  <FileJson size={20} className="text-orange-600" />
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-slate-900">Export as JSON</div>
                    <div className="text-xs text-slate-600">Machine-readable format</div>
                  </div>
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  disabled={exporting}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-white rounded-xl border-2 border-slate-200 active:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  <FileSpreadsheet size={20} className="text-green-600" />
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-slate-900">Export as CSV</div>
                    <div className="text-xs text-slate-600">Spreadsheet compatible</div>
                  </div>
                </button>
                <div className="text-xs text-slate-500 px-2 py-1">
                  Exporting {memories.length} memories, {contacts.length} contacts, {reminders.length} reminders
                </div>
              </div>
            )}
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
            <div className="h-px bg-slate-100"></div>
            <button
              onClick={handleSeedDemo}
              disabled={seeding}
              className="w-full px-5 py-4 flex items-center justify-between active:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span className="font-medium text-slate-900">Load Demo Data</span>
              </div>
              {seeding && (
                <div className="animate-spin w-5 h-5 border-2 border-cyan-600 border-t-transparent rounded-full"></div>
              )}
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
                <span className="text-sm text-slate-500">v1.1.0</span>
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
