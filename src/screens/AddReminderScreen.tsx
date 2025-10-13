import { useState } from 'react';
import { ArrowLeft, Calendar, Clock, AlignLeft, Flag, AlertCircle } from 'lucide-react';
import { useReminders } from '../hooks/useReminders';

interface AddReminderScreenProps {
  onBack: () => void;
  onSave: () => void;
}

export function AddReminderScreen({ onBack, onSave }: AddReminderScreenProps) {
  const { addReminder } = useReminders();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let dueDate = formData.date;
      if (formData.time) {
        dueDate = `${formData.date}T${formData.time}:00`;
      }

      const { error: addError } = await addReminder({
        title: formData.title,
        description: formData.description || undefined,
        due_date: dueDate,
        priority: formData.priority,
      });

      if (addError) throw new Error(addError);

      onSave();
    } catch (err: any) {
      setError(err.message || 'Failed to create reminder');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center">
          <button onClick={onBack} className="p-2 -ml-2 active:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-slate-700" />
          </button>
          <h1 className="text-xl font-bold text-slate-900 ml-4">New Reminder</h1>
        </div>
        <button
          type="submit"
          form="reminder-form"
          disabled={loading}
          className="text-orange-600 font-bold px-5 py-2.5 active:bg-orange-50 rounded-lg transition-colors disabled:opacity-50 text-lg"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>

      <form id="reminder-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            What do you need to remember? *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Follow up with Sarah about demo"
            className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors text-lg"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Additional Notes
          </label>
          <div className="relative">
            <AlignLeft size={20} className="absolute left-4 top-4 text-slate-400" />
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Add any additional details..."
              rows={4}
              className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors resize-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Date *
            </label>
            <div className="relative">
              <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full pl-10 pr-3 py-3.5 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Time
            </label>
            <div className="relative">
              <Clock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                className="w-full pl-10 pr-3 py-3.5 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            <Flag size={18} className="inline mr-2 text-slate-400" />
            Priority Level
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, priority: 'low' }))}
              className={`py-3 rounded-xl font-semibold transition-all ${
                formData.priority === 'low'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-white text-slate-600 border-2 border-slate-200'
              }`}
            >
              Low
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, priority: 'medium' }))}
              className={`py-3 rounded-xl font-semibold transition-all ${
                formData.priority === 'medium'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-white text-slate-600 border-2 border-slate-200'
              }`}
            >
              Medium
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, priority: 'high' }))}
              className={`py-3 rounded-xl font-semibold transition-all ${
                formData.priority === 'high'
                  ? 'bg-red-500 text-white shadow-md'
                  : 'bg-white text-slate-600 border-2 border-slate-200'
              }`}
            >
              High
            </button>
          </div>
        </div>

        <div className="pt-4">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-2">Quick Presets</h3>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  setFormData(prev => ({
                    ...prev,
                    date: tomorrow.toISOString().split('T')[0],
                    time: '09:00',
                  }));
                }}
                className="w-full text-left px-3 py-2 bg-white rounded-lg text-sm text-slate-700 active:bg-slate-100 transition-colors"
              >
                Tomorrow at 9:00 AM
              </button>
              <button
                type="button"
                onClick={() => {
                  const nextWeek = new Date();
                  nextWeek.setDate(nextWeek.getDate() + 7);
                  setFormData(prev => ({
                    ...prev,
                    date: nextWeek.toISOString().split('T')[0],
                    time: '10:00',
                  }));
                }}
                className="w-full text-left px-3 py-2 bg-white rounded-lg text-sm text-slate-700 active:bg-slate-100 transition-colors"
              >
                Next week at 10:00 AM
              </button>
              <button
                type="button"
                onClick={() => {
                  const nextMonth = new Date();
                  nextMonth.setMonth(nextMonth.getMonth() + 1);
                  setFormData(prev => ({
                    ...prev,
                    date: nextMonth.toISOString().split('T')[0],
                  }));
                }}
                className="w-full text-left px-3 py-2 bg-white rounded-lg text-sm text-slate-700 active:bg-slate-100 transition-colors"
              >
                One month from now
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
