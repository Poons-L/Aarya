import { ArrowLeft, Bell, Calendar, Check, Clock, AlertCircle } from 'lucide-react';
import { useReminders } from '../hooks/useReminders';
import { BottomNav } from '../components/BottomNav';

interface RemindersScreenProps {
  onBack: () => void;
  onAddReminder: () => void;
  onNavigate: (screen: string) => void;
}

export function RemindersScreen({ onBack, onAddReminder, onNavigate }: RemindersScreenProps) {
  const { reminders, toggleComplete } = useReminders();

  const handleToggle = async (id: string, completed: boolean) => {
    await toggleComplete(id, completed);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-pink-600 bg-red-50 border-pink-200';
      case 'medium':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getDaysUntil = (dateString: string) => {
    const today = new Date();
    const dueDate = new Date(dateString);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `${diffDays} days`;
  };

  const upcomingReminders = reminders.filter(r => !r.completed);
  const completedReminders = reminders.filter(r => r.completed);

  return (
    <div className="h-full bg-slate-50 flex flex-col">
      <div className="bg-white px-6 pt-14 pb-6 border-b border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button onClick={onBack} className="p-2 -ml-2 active:bg-slate-100 rounded-full transition-colors">
              <ArrowLeft size={24} className="text-slate-700" />
            </button>
            <h1 className="text-xl font-bold text-slate-900 ml-4">Reminders</h1>
          </div>
          <button
            onClick={onAddReminder}
            className="px-4 py-2 bg-orange-500 text-white font-semibold rounded-xl active:scale-95 transition-transform"
          >
            Add New
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">{upcomingReminders.length}</div>
            <div className="text-xs text-slate-600">Upcoming</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-pink-600">
              {upcomingReminders.filter(r => getDaysUntil(r.due_date) === 'Today' || getDaysUntil(r.due_date) === 'Overdue').length}
            </div>
            <div className="text-xs text-slate-600">Urgent</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{completedReminders.length}</div>
            <div className="text-xs text-slate-600">Completed</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Upcoming</h2>
          <div className="space-y-3">
            {upcomingReminders.map(reminder => {
              const daysUntil = getDaysUntil(reminder.due_date);
              const isUrgent = daysUntil === 'Today' || daysUntil === 'Overdue';

              return (
                <div
                  key={reminder.id}
                  className={`bg-white rounded-2xl p-5 shadow-sm border transition-all ${
                    isUrgent ? 'border-pink-200 bg-red-50/30' : 'border-slate-100'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => handleToggle(reminder.id, !reminder.completed)}
                      className="w-6 h-6 rounded-full border-2 border-slate-300 flex-shrink-0 mt-0.5 active:bg-slate-100 transition-colors"
                    >
                      {reminder.completed && (
                        <Check size={14} className="text-orange-600 m-auto" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-slate-900">{reminder.title}</h3>
                        {isUrgent && (
                          <AlertCircle size={18} className="text-pink-600 flex-shrink-0" />
                        )}
                      </div>

                      {reminder.description && (
                        <p className="text-sm text-slate-600 mb-3">{reminder.description}</p>
                      )}

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Clock size={14} />
                          <span className={isUrgent ? 'text-pink-600 font-semibold' : ''}>
                            {daysUntil}
                          </span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(reminder.priority)}`}>
                          {reminder.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {completedReminders.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Completed</h2>
            <div className="space-y-3">
              {completedReminders.map(reminder => (
                <div
                  key={reminder.id}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 opacity-60"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-orange-500 flex-shrink-0 mt-0.5 flex items-center justify-center">
                      <Check size={14} className="text-white" />
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 line-through">{reminder.title}</h3>
                      {reminder.description && (
                        <p className="text-sm text-slate-600 mt-1">{reminder.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <BottomNav currentScreen="reminders" onNavigate={onNavigate} />
    </div>
  );
}
