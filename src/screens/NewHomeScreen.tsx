import { useNavigate } from 'react-router-dom';
import { Users, Plus, Mic, Search as SearchIcon, Bell, Calendar, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useContacts } from '../hooks/useContacts';
import { useReminders } from '../hooks/useReminders';

export function NewHomeScreen() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { contacts } = useContacts();
  const { reminders } = useReminders();

  const now = new Date();
  const upcomingReminders = reminders
    .filter(r => !r.completed && new Date(r.due_date) >= now)
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 3);

  const recentContacts = contacts
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const overdueCount = reminders.filter(
    r => !r.completed && new Date(r.due_date) < now
  ).length;

  const getGreeting = () => {
    const hour = now.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 pt-8 pb-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {getGreeting()}
                {profile?.full_name && `, ${profile.full_name.split(' ')[0]}`}
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            {profile?.avatar_url && (
              <button
                onClick={() => navigate('/profile')}
                className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-orange-400"
              >
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Users size={20} className="text-orange-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{contacts.length}</div>
              <div className="text-xs text-slate-600">Contacts</div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Bell size={20} className="text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {upcomingReminders.length}
              </div>
              <div className="text-xs text-slate-600">Upcoming</div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={20} className={overdueCount > 0 ? "text-red-500" : "text-emerald-500"} />
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {overdueCount}
              </div>
              <div className="text-xs text-slate-600">Overdue</div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/contacts/add')}
                className="bg-gradient-to-br from-orange-500 to-pink-500 text-white p-4 rounded-xl shadow-md active:scale-95 transition-transform"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Plus size={24} />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Add Contact</div>
                    <div className="text-xs opacity-90">Full details</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigate('/quick-capture')}
                className="bg-gradient-to-br from-amber-500 to-orange-500 text-white p-4 rounded-xl shadow-md active:scale-95 transition-transform"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Mic size={24} />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Quick Capture</div>
                    <div className="text-xs opacity-90">Fast add</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {upcomingReminders.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-700">Upcoming Follow-ups</h2>
                <button
                  onClick={() => navigate('/reminders')}
                  className="text-xs text-orange-600 font-medium"
                >
                  View All
                </button>
              </div>
              <div className="space-y-2">
                {upcomingReminders.map(reminder => {
                  const contact = reminder.contact_id
                    ? contacts.find(c => c.id === reminder.contact_id)
                    : null;

                  return (
                    <div
                      key={reminder.id}
                      className="bg-white rounded-xl p-3 shadow-sm border border-slate-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">
                          {contact ? contact.name[0] : '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-900 text-sm truncate">
                            {reminder.title}
                          </div>
                          <div className="text-xs text-slate-600">
                            {formatDate(reminder.due_date)}
                            {contact && ` • ${contact.name}`}
                          </div>
                        </div>
                        <Calendar size={16} className="text-orange-500" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {recentContacts.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-700">Recent Contacts</h2>
                <button
                  onClick={() => navigate('/contacts')}
                  className="text-xs text-orange-600 font-medium"
                >
                  View All
                </button>
              </div>
              <div className="space-y-2">
                {recentContacts.map(contact => (
                  <button
                    key={contact.id}
                    onClick={() => navigate(`/contacts/${contact.id}`)}
                    className="w-full bg-white rounded-xl p-3 shadow-sm border border-slate-200 active:scale-98 transition-transform"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-semibold">
                        {contact.photo_url ? (
                          <img
                            src={contact.photo_url}
                            alt={contact.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          contact.name[0]
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="font-semibold text-slate-900 truncate">
                          {contact.name}
                        </div>
                        <div className="text-sm text-slate-600 truncate">
                          {contact.title && contact.company
                            ? `${contact.title} at ${contact.company}`
                            : contact.company || contact.title || 'No title'}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {contacts.length === 0 && (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-200">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={32} className="text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No contacts yet
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Start building your network by adding your first contact
              </p>
              <button
                onClick={() => navigate('/contacts/add')}
                className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-6 py-2 rounded-lg font-medium active:scale-95 transition-transform"
              >
                Add First Contact
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
