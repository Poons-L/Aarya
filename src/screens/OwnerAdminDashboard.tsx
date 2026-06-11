import { useEffect, useState } from 'react';
import { ArrowLeft, Users, Search, Mail, Shield, Activity, UserX, ChevronUp, ChevronDown, Star, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const OWNER_EMAIL = 'poonam@uplifyt.com';

interface OwnerAdminDashboardProps {
  onBack?: () => void;
}

interface UserRow {
  id: string;
  email: string;
  signup_method: 'Google' | 'Email';
  created_at: string;
  last_sign_in_at: string | null;
  contact_count: number;
  interaction_count: number;
}

interface AdminStats {
  summary: {
    totalUsers: number;
    totalContacts: number;
    totalInteractions: number;
    activeUsers: number;
    inactiveUsers: number;
  };
  sourceBreakdown: {
    google: { count: number; percentage: number };
    email: { count: number; percentage: number };
  };
  users: UserRow[];
}

interface FeedbackEntry {
  id: string;
  user_id: string;
  user_email?: string;
  rating: number;
  category: string;
  message: string;
  created_at: string;
}

type SortField = 'email' | 'signup_method' | 'created_at' | 'last_sign_in_at' | 'contact_count' | 'interaction_count';
type Tab = 'overview' | 'feedback';

export default function OwnerAdminDashboard({ onBack }: OwnerAdminDashboardProps) {
  const { user, session } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  useEffect(() => {
    if (!user || user.email !== OWNER_EMAIL) {
      if (onBack) onBack();
      return;
    }
    fetchStats();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'feedback' && feedback.length === 0) {
      fetchFeedback();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-stats`;
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to fetch admin statistics');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedback = async () => {
    setFeedbackLoading(true);
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-stats`;
      const response = await fetch(`${apiUrl}?tab=feedback`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.feedback) {
          setFeedback(data.feedback);
        }
      }
    } catch (err) {
      console.error('Error fetching feedback:', err);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const sortedUsers = stats?.users
    ? [...stats.users]
        .filter(u => u.email.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
          let aVal: string | number = '';
          let bVal: string | number = '';

          if (sortField === 'contact_count' || sortField === 'interaction_count') {
            aVal = a[sortField];
            bVal = b[sortField];
          } else if (sortField === 'created_at' || sortField === 'last_sign_in_at') {
            aVal = new Date(a[sortField] || 0).getTime();
            bVal = new Date(b[sortField] || 0).getTime();
          } else {
            aVal = (a[sortField] || '').toLowerCase();
            bVal = (b[sortField] || '').toLowerCase();
          }

          if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
          if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
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

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc'
      ? <ChevronUp size={14} className="inline ml-0.5" />
      : <ChevronDown size={14} className="inline ml-0.5" />;
  };

  // Feedback calculations
  const feedbackCount = feedback.length;
  const avgRating = feedbackCount > 0
    ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedbackCount).toFixed(1)
    : '0';
  const categoryBreakdown = feedback.reduce<Record<string, number>>((acc, f) => {
    acc[f.category] = (acc[f.category] || 0) + 1;
    return acc;
  }, {});

  if (!user || user.email !== OWNER_EMAIL) return null;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-600 text-sm">Loading admin data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50 p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 max-w-sm w-full text-center">
          <p className="text-red-600 font-medium mb-3">{error}</p>
          <button onClick={onBack} className="px-5 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-5 py-3 flex items-center gap-3">
        <button onClick={onBack} className="p-1 text-slate-600">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-bold text-slate-900">Admin Report</h1>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-5 flex gap-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-slate-500'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('feedback')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'feedback'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-slate-500'
          }`}
        >
          <MessageSquare size={14} />
          Feedback
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'overview' ? (
          <div className="p-5 space-y-5">
            {/* Summary Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Users size={16} className="text-orange-500" />
                  <span className="text-xs font-medium text-slate-500">Total Users</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{stats?.summary.totalUsers || 0}</div>
              </div>

              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Activity size={16} className="text-green-500" />
                  <span className="text-xs font-medium text-slate-500">Active (7d)</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{stats?.summary.activeUsers || 0}</div>
              </div>

              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <UserX size={16} className="text-red-400" />
                  <span className="text-xs font-medium text-slate-500">Inactive (30d+)</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{stats?.summary.inactiveUsers || 0}</div>
              </div>

              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Mail size={16} className="text-blue-500" />
                  <span className="text-xs font-medium text-slate-500">Total Contacts</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{stats?.summary.totalContacts || 0}</div>
              </div>
            </div>

            {/* Total Interactions */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-slate-500">Total Interactions Logged</span>
                  <div className="text-2xl font-bold text-slate-900">{stats?.summary.totalInteractions || 0}</div>
                </div>
                <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center">
                  <Activity size={20} className="text-amber-500" />
                </div>
              </div>
            </div>

            {/* Sign-up Source Breakdown */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-800 mb-3">Sign-up Method Breakdown</h2>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm text-slate-700">Google OAuth</span>
                    </div>
                    <span className="text-sm font-medium text-slate-900">
                      {stats?.sourceBreakdown.google.count || 0} ({stats?.sourceBreakdown.google.percentage || 0}%)
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${stats?.sourceBreakdown.google.percentage || 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span className="text-sm text-slate-700">Email/Password</span>
                    </div>
                    <span className="text-sm font-medium text-slate-900">
                      {stats?.sourceBreakdown.email.count || 0} ({stats?.sourceBreakdown.email.percentage || 0}%)
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full transition-all"
                      style={{ width: `${stats?.sourceBreakdown.email.percentage || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* User Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-slate-800">All Users</h2>
                  <span className="text-xs text-slate-500">{sortedUsers.length} users</span>
                </div>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <th className="py-2.5 px-3 font-medium text-slate-600 cursor-pointer hover:text-slate-900 whitespace-nowrap" onClick={() => handleSort('email')}>
                        Email<SortIcon field="email" />
                      </th>
                      <th className="py-2.5 px-3 font-medium text-slate-600 cursor-pointer hover:text-slate-900 whitespace-nowrap" onClick={() => handleSort('signup_method')}>
                        Method<SortIcon field="signup_method" />
                      </th>
                      <th className="py-2.5 px-3 font-medium text-slate-600 cursor-pointer hover:text-slate-900 whitespace-nowrap" onClick={() => handleSort('created_at')}>
                        Signed Up<SortIcon field="created_at" />
                      </th>
                      <th className="py-2.5 px-3 font-medium text-slate-600 cursor-pointer hover:text-slate-900 whitespace-nowrap" onClick={() => handleSort('last_sign_in_at')}>
                        Last Active<SortIcon field="last_sign_in_at" />
                      </th>
                      <th className="py-2.5 px-3 font-medium text-slate-600 cursor-pointer hover:text-slate-900 whitespace-nowrap text-center" onClick={() => handleSort('contact_count')}>
                        Contacts<SortIcon field="contact_count" />
                      </th>
                      <th className="py-2.5 px-3 font-medium text-slate-600 cursor-pointer hover:text-slate-900 whitespace-nowrap text-center" onClick={() => handleSort('interaction_count')}>
                        Interactions<SortIcon field="interaction_count" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedUsers.map((u) => (
                      <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="py-2.5 px-3 text-slate-800 max-w-[160px] truncate">{u.email}</td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            u.signup_method === 'Google'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-orange-50 text-orange-700'
                          }`}>
                            {u.signup_method === 'Google' ? <Shield size={10} /> : <Mail size={10} />}
                            {u.signup_method}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{formatDate(u.created_at)}</td>
                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{formatDate(u.last_sign_in_at)}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-xs font-medium min-w-[28px]">
                            {u.contact_count}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-xs font-medium min-w-[28px]">
                            {u.interaction_count}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {sortedUsers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 text-sm">
                          {searchQuery ? 'No users match your search' : 'No users found'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* Feedback Tab */
          <div className="p-5 space-y-5">
            {feedbackLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                {/* Feedback Summary Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare size={16} className="text-orange-500" />
                      <span className="text-xs font-medium text-slate-500">Total Feedback</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{feedbackCount}</div>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Star size={16} className="text-amber-400" />
                      <span className="text-xs font-medium text-slate-500">Avg Rating</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{avgRating}</div>
                  </div>
                </div>

                {/* Category Breakdown */}
                {Object.keys(categoryBreakdown).length > 0 && (
                  <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <h2 className="text-sm font-semibold text-slate-800 mb-3">By Category</h2>
                    <div className="space-y-2">
                      {Object.entries(categoryBreakdown)
                        .sort((a, b) => b[1] - a[1])
                        .map(([cat, count]) => (
                        <div key={cat} className="flex items-center justify-between">
                          <span className="text-sm text-slate-700">{cat}</span>
                          <span className="text-sm font-medium text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-full">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Feedback Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-100">
                    <h2 className="text-sm font-semibold text-slate-800">All Feedback</h2>
                  </div>

                  {feedback.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-sm">
                      No feedback received yet
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {feedback.map((entry) => (
                        <div key={entry.id} className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  size={14}
                                  className={s <= entry.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-slate-400">{formatDate(entry.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                              {entry.category}
                            </span>
                            <span className="text-xs text-slate-400 truncate">
                              {entry.user_email || entry.user_id.slice(0, 8)}
                            </span>
                          </div>
                          {entry.message && (
                            <p className="text-sm text-slate-700 leading-relaxed">{entry.message}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
