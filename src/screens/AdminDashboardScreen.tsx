import { useState, useEffect } from 'react';
import { ArrowLeft, Home, Users, Database, Activity, Calendar, MessageSquare, Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AdminDashboardScreenProps {
  onBack: () => void;
  onHome: () => void;
}

interface SystemStats {
  totalUsers: number;
  totalContacts: number;
  totalMemories: number;
  totalReminders: number;
  totalEvents: number;
  totalConversations: number;
}

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
}

export default function AdminDashboardScreen({ onBack, onHome }: AdminDashboardScreenProps) {
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalContacts: 0,
    totalMemories: 0,
    totalReminders: 0,
    totalEvents: 0,
    totalConversations: 0,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'users'>('stats');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const [usersRes, contactsRes, memoriesRes, remindersRes, eventsRes, conversationsRes] =
        await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact' }),
          supabase.from('contacts').select('*', { count: 'exact', head: true }),
          supabase.from('memories').select('*', { count: 'exact', head: true }),
          supabase.from('reminders').select('*', { count: 'exact', head: true }),
          supabase.from('events').select('*', { count: 'exact', head: true }),
          supabase.from('conversations').select('*', { count: 'exact', head: true }),
        ]);

      setStats({
        totalUsers: usersRes.count || 0,
        totalContacts: contactsRes.count || 0,
        totalMemories: memoriesRes.count || 0,
        totalReminders: remindersRes.count || 0,
        totalEvents: eventsRes.count || 0,
        totalConversations: conversationsRes.count || 0,
      });

      if (usersRes.data) {
        setUsers(usersRes.data);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-slate-600">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      <div className="px-6 py-4 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="text-slate-600 active:text-slate-900 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft size={24} />
            </button>
            <button
              onClick={onHome}
              className="text-slate-600 active:text-slate-900 transition-colors"
              aria-label="Go to home"
            >
              <Home size={24} />
            </button>
          </div>
          <div className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full">
            ADMIN
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-sm text-slate-600 mt-1">System overview and user management</p>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'stats'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 active:bg-slate-200'
            }`}
          >
            Statistics
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 active:bg-slate-200'
            }`}
          >
            Users
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {activeTab === 'stats' ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users size={20} className="text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{stats.totalUsers}</div>
                  <div className="text-xs text-slate-600">Total Users</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Database size={20} className="text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{stats.totalContacts}</div>
                  <div className="text-xs text-slate-600">Total Contacts</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Activity size={20} className="text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{stats.totalMemories}</div>
                  <div className="text-xs text-slate-600">Total Memories</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <Bell size={20} className="text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{stats.totalReminders}</div>
                  <div className="text-xs text-slate-600">Total Reminders</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                  <Calendar size={20} className="text-teal-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{stats.totalEvents}</div>
                  <div className="text-xs text-slate-600">Total Events</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                  <MessageSquare size={20} className="text-pink-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{stats.totalConversations}</div>
                  <div className="text-xs text-slate-600">Conversations</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-slate-900">
                    {user.full_name || 'No name'}
                  </div>
                  <div
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      user.role === 'admin'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {user.role}
                  </div>
                </div>
                <div className="text-sm text-slate-600 mb-1">{user.email}</div>
                <div className="text-xs text-slate-400">
                  Joined {new Date(user.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
