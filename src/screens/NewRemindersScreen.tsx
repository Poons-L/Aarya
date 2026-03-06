import { useState, useMemo } from 'react';
import { Bell, Plus, Check, Clock, Calendar, AlertCircle } from 'lucide-react';
import { useReminders } from '../hooks/useReminders';
import { useContacts } from '../hooks/useContacts';

interface NewRemindersScreenProps {
  onNavigate: (screen: string) => void;
  onViewContact: (contactId: string) => void;
}

export function NewRemindersScreen({ onNavigate, onViewContact }: NewRemindersScreenProps) {
  const { reminders, updateReminder, deleteReminder } = useReminders();
  const { contacts } = useContacts();
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'overdue' | 'completed'>('upcoming');

  const now = new Date();

  const categorizedReminders = useMemo(() => {
    const overdue = reminders.filter(r => !r.completed && new Date(r.due_date) < now);
    const upcoming = reminders.filter(r => !r.completed && new Date(r.due_date) >= now);
    const completed = reminders.filter(r => r.completed);

    return { overdue, upcoming, completed };
  }, [reminders, now]);

  const displayedReminders = useMemo(() => {
    let filtered = [];

    switch (filter) {
      case 'overdue':
        filtered = categorizedReminders.overdue;
        break;
      case 'upcoming':
        filtered = categorizedReminders.upcoming;
        break;
      case 'completed':
        filtered = categorizedReminders.completed;
        break;
      case 'all':
      default:
        filtered = reminders;
    }

    return filtered.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
  }, [reminders, filter, categorizedReminders]);

  const markComplete = async (reminderId: string, completed: boolean) => {
    await updateReminder(reminderId, {
      completed,
      completed_at: completed ? new Date().toISOString() : null
    });
  };

  const snoozeReminder = async (reminderId: string, days: number) => {
    const reminder = reminders.find(r => r.id === reminderId);
    if (!reminder) return;

    const newDate = new Date(reminder.due_date);
    newDate.setDate(newDate.getDate() + days);

    await updateReminder(reminderId, {
      due_date: newDate.toISOString()
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getContact = (contactId: string | null) => {
    if (!contactId) return null;
    return contacts.find(c => c.id === contactId);
  };

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      <div className="bg-white border-b border-slate-200 px-6 pt-8 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Reminders</h1>
            <p className="text-sm text-slate-600 mt-1">
              {categorizedReminders.overdue.length} overdue, {categorizedReminders.upcoming.length} upcoming
            </p>
          </div>
          <button
            onClick={() => onNavigate('addReminder')}
            className="bg-gradient-to-r from-orange-500 to-pink-500 text-white p-3 rounded-full shadow-lg active:scale-95 transition-transform"
          >
            <Plus size={24} />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === 'upcoming'
                ? 'bg-orange-500 text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            Upcoming ({categorizedReminders.upcoming.length})
          </button>
          <button
            onClick={() => setFilter('overdue')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === 'overdue'
                ? 'bg-red-500 text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            Overdue ({categorizedReminders.overdue.length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === 'completed'
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            Completed ({categorizedReminders.completed.length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === 'all'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            All ({reminders.length})
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {displayedReminders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center mb-4">
              <Bell size={40} className="text-white" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {filter === 'completed' ? 'No completed reminders' :
               filter === 'overdue' ? 'No overdue reminders' :
               filter === 'upcoming' ? 'No upcoming reminders' :
               'No reminders yet'}
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              {filter === 'all'
                ? 'Create reminders to follow up with your contacts'
                : `Switch to another filter or create a new reminder`}
            </p>
            {filter === 'all' && (
              <button
                onClick={() => onNavigate('addReminder')}
                className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-6 py-2 rounded-lg font-medium active:scale-95 transition-transform"
              >
                Create First Reminder
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {displayedReminders.map(reminder => {
              const contact = getContact(reminder.contact_id);
              const isOverdue = !reminder.completed && new Date(reminder.due_date) < now;
              const [showActions, setShowActions] = useState(false);

              return (
                <div
                  key={reminder.id}
                  className={`bg-white rounded-xl p-4 shadow-sm border-2 transition-all ${
                    reminder.completed
                      ? 'border-emerald-200 opacity-60'
                      : isOverdue
                      ? 'border-red-300'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => markComplete(reminder.id, !reminder.completed)}
                      className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        reminder.completed
                          ? 'bg-emerald-500 border-emerald-500'
                          : isOverdue
                          ? 'border-red-400'
                          : 'border-orange-400'
                      }`}
                    >
                      {reminder.completed && <Check size={16} className="text-white" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold text-slate-900 mb-1 ${reminder.completed ? 'line-through' : ''}`}>
                        {reminder.title}
                      </div>

                      {reminder.description && (
                        <div className="text-sm text-slate-600 mb-2">
                          {reminder.description}
                        </div>
                      )}

                      <div className="flex items-center gap-2 flex-wrap">
                        <div className={`flex items-center gap-1 text-xs ${
                          isOverdue ? 'text-red-600' : 'text-slate-600'
                        }`}>
                          {isOverdue ? <AlertCircle size={14} /> : <Calendar size={14} />}
                          {formatDate(reminder.due_date)}
                        </div>

                        {contact && (
                          <button
                            onClick={() => onViewContact(contact.id)}
                            className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full active:scale-95 transition-transform"
                          >
                            {contact.name}
                          </button>
                        )}

                        {reminder.priority !== 'medium' && (
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            reminder.priority === 'high'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {reminder.priority}
                          </span>
                        )}
                      </div>

                      {!reminder.completed && (
                        <div className="mt-3">
                          {!showActions ? (
                            <button
                              onClick={() => setShowActions(true)}
                              className="text-xs text-orange-600 font-medium"
                            >
                              Actions
                            </button>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  snoozeReminder(reminder.id, 1);
                                  setShowActions(false);
                                }}
                                className="px-3 py-1 bg-amber-100 text-amber-700 text-xs rounded-lg font-medium active:scale-95 transition-transform"
                              >
                                +1 day
                              </button>
                              <button
                                onClick={() => {
                                  snoozeReminder(reminder.id, 7);
                                  setShowActions(false);
                                }}
                                className="px-3 py-1 bg-amber-100 text-amber-700 text-xs rounded-lg font-medium active:scale-95 transition-transform"
                              >
                                +1 week
                              </button>
                              <button
                                onClick={() => setShowActions(false)}
                                className="px-3 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg font-medium"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
