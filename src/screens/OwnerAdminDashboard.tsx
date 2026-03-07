import React, { useEffect, useState } from 'react';
import { ArrowLeft, Users, Contact, Sparkles, TrendingUp, Search, Calendar, Mail, Building2, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const OWNER_EMAIL = 'Chicchori@gmail.com';

interface OwnerAdminDashboardProps {
  onBack?: () => void;
}

interface AdminStats {
  metrics: {
    totalUsers: number;
    totalContacts: number;
    totalAIUsage: number;
    newUsersThisWeek: number;
    newContactsThisWeek: number;
    activeUsers: number;
  };
  users: Array<{
    id: string;
    email: string;
    created_at: string;
    last_sign_in_at: string | null;
    contact_count: number;
  }>;
  charts: {
    signupsOverTime: Array<{ date: string; count: number }>;
    contactsOverTime: Array<{ date: string; count: number }>;
  };
  recentActivity: {
    recentContacts: Array<{
      id: string;
      name: string;
      email: string | null;
      company: string | null;
      created_at: string;
      user_id: string;
    }>;
    recentSignups: Array<{
      id: string;
      email: string;
      created_at: string;
    }>;
  };
}

export default function OwnerAdminDashboard({ onBack }: OwnerAdminDashboardProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'email' | 'created_at' | 'contact_count' | 'last_sign_in_at'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (!user || user.email !== OWNER_EMAIL) {
      if (onBack) onBack();
      return;
    }

    fetchAdminStats();
  }, [user]);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-stats`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch admin statistics');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching admin stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load admin stats');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSortedUsers = stats?.users
    ? stats.users
        .filter((u) =>
          u.email.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
          let aVal: string | number = a[sortField] ?? '';
          let bVal: string | number = b[sortField] ?? '';

          if (sortField === 'contact_count') {
            aVal = a.contact_count;
            bVal = b.contact_count;
          } else if (sortField === 'created_at' || sortField === 'last_sign_in_at') {
            aVal = new Date(a[sortField] || 0).getTime();
            bVal = new Date(b[sortField] || 0).getTime();
          }

          if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
          if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
          return 0;
        })
    : [];

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (!user || user.email !== OWNER_EMAIL) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-medium"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 pb-20">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/50 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <div className="w-10"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-orange-100">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-orange-500" />
              <span className="text-xs text-gray-500 bg-orange-50 px-2 py-1 rounded-full">
                +{stats?.metrics.newUsersThisWeek || 0} this week
              </span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{stats?.metrics.totalUsers || 0}</h3>
            <p className="text-gray-600 text-sm mt-1">Total Users</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-pink-100">
            <div className="flex items-center justify-between mb-2">
              <Contact className="w-8 h-8 text-pink-500" />
              <span className="text-xs text-gray-500 bg-pink-50 px-2 py-1 rounded-full">
                +{stats?.metrics.newContactsThisWeek || 0} this week
              </span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{stats?.metrics.totalContacts || 0}</h3>
            <p className="text-gray-600 text-sm mt-1">Total Contacts</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-purple-100">
            <div className="flex items-center justify-between mb-2">
              <Sparkles className="w-8 h-8 text-purple-500" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{stats?.metrics.totalAIUsage || 0}</h3>
            <p className="text-gray-600 text-sm mt-1">AI Generations</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{stats?.metrics.activeUsers || 0}</h3>
            <p className="text-gray-600 text-sm mt-1">Active Users (7 days)</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-100">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{stats?.metrics.newUsersThisWeek || 0}</h3>
            <p className="text-gray-600 text-sm mt-1">New Users This Week</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-amber-100">
            <div className="flex items-center justify-between mb-2">
              <Contact className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{stats?.metrics.newContactsThisWeek || 0}</h3>
            <p className="text-gray-600 text-sm mt-1">New Contacts This Week</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              User Signups (Last 30 Days)
            </h2>
            <div className="h-64 flex items-end justify-between gap-1">
              {stats?.charts.signupsOverTime.slice(-30).map((day, idx) => {
                const maxCount = Math.max(...stats.charts.signupsOverTime.map(d => d.count), 1);
                const height = (day.count / maxCount) * 100;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center group relative">
                    <div
                      className="w-full bg-gradient-to-t from-orange-500 to-pink-500 rounded-t transition-all hover:opacity-80"
                      style={{ height: `${height}%`, minHeight: day.count > 0 ? '4px' : '0' }}
                    ></div>
                    <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {day.count} users
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">Hover over bars to see details</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Contact className="w-5 h-5 text-pink-500" />
              Contacts Added (Last 30 Days)
            </h2>
            <div className="h-64 flex items-end justify-between gap-1">
              {stats?.charts.contactsOverTime.slice(-30).map((day, idx) => {
                const maxCount = Math.max(...stats.charts.contactsOverTime.map(d => d.count), 1);
                const height = (day.count / maxCount) * 100;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center group relative">
                    <div
                      className="w-full bg-gradient-to-t from-pink-500 to-purple-500 rounded-t transition-all hover:opacity-80"
                      style={{ height: `${height}%`, minHeight: day.count > 0 ? '4px' : '0' }}
                    ></div>
                    <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {day.count} contacts
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">Hover over bars to see details</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-500" />
              All Users
            </h2>
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th
                    className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('email')}
                  >
                    Email {sortField === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('created_at')}
                  >
                    Joined {sortField === 'created_at' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('contact_count')}
                  >
                    Contacts {sortField === 'contact_count' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('last_sign_in_at')}
                  >
                    Last Active {sortField === 'last_sign_in_at' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900">{user.email}</td>
                    <td className="py-3 px-4 text-gray-600">{formatDate(user.created_at)}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
                        {user.contact_count}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{formatDate(user.last_sign_in_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Contact className="w-5 h-5 text-pink-500" />
              Recent Contacts Added
            </h2>
            <div className="space-y-3">
              {stats?.recentActivity.recentContacts.map((contact) => (
                <div key={contact.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{contact.name}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      {contact.email && (
                        <span className="flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3" />
                          {contact.email}
                        </span>
                      )}
                      {contact.company && (
                        <span className="flex items-center gap-1 truncate">
                          <Building2 className="w-3 h-3" />
                          {contact.company}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDateTime(contact.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-green-500" />
              Recent Signups
            </h2>
            <div className="space-y-3">
              {stats?.recentActivity.recentSignups.map((signup) => (
                <div key={signup.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    {signup.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{signup.email}</p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDateTime(signup.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
