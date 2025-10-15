import { Clock, Plus, Check } from 'lucide-react';
import { useState } from 'react';
import { useReminders } from '../hooks/useReminders';

interface QuickReminderChipsProps {
  memoryText: string;
  contactId?: string;
  onReminderCreated?: () => void;
}

export function QuickReminderChips({
  memoryText,
  contactId,
  onReminderCreated
}: QuickReminderChipsProps) {
  const { addReminder } = useReminders();
  const [showCustom, setShowCustom] = useState(false);
  const [customDays, setCustomDays] = useState('');
  const [created, setCreated] = useState(false);

  const createReminder = async (days: number) => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + days);

    const title = memoryText.length > 50
      ? memoryText.substring(0, 47) + '...'
      : memoryText;

    await addReminder({
      title: `Follow up: ${title}`,
      description: memoryText,
      due_date: dueDate.toISOString(),
      contact_id: contactId,
      priority: 'medium',
    });

    setCreated(true);
    setTimeout(() => setCreated(false), 2000);

    if (onReminderCreated) {
      onReminderCreated();
    }
  };

  const handleCustomReminder = () => {
    const days = parseInt(customDays);
    if (days > 0) {
      createReminder(days);
      setShowCustom(false);
      setCustomDays('');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        {created ? (
          <>
            <Check size={16} className="text-green-600" />
            <span className="font-medium text-green-600">Reminder created!</span>
          </>
        ) : (
          <>
            <Clock size={16} />
            <span className="font-medium">Set follow-up reminder</span>
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => createReminder(3)}
          className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full text-sm font-medium shadow-md active:scale-95 transition-transform"
        >
          3 days
        </button>
        <button
          type="button"
          onClick={() => createReminder(7)}
          className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full text-sm font-medium shadow-md active:scale-95 transition-transform"
        >
          1 week
        </button>
        <button
          type="button"
          onClick={() => createReminder(30)}
          className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full text-sm font-medium shadow-md active:scale-95 transition-transform"
        >
          1 month
        </button>
        <button
          type="button"
          onClick={() => setShowCustom(!showCustom)}
          className="px-4 py-2 bg-white border-2 border-orange-500 text-orange-600 rounded-full text-sm font-medium active:scale-95 transition-transform flex items-center gap-1"
        >
          <Plus size={16} />
          Custom
        </button>
      </div>

      {showCustom && (
        <div className="flex gap-2 animate-in slide-in-from-top-2">
          <input
            type="number"
            min="1"
            max="365"
            value={customDays}
            onChange={(e) => setCustomDays(e.target.value)}
            placeholder="Days"
            className="flex-1 px-3 py-2 border-2 border-slate-200 rounded-lg focus:border-orange-500 focus:outline-none text-sm"
          />
          <button
            type="button"
            onClick={handleCustomReminder}
            disabled={!customDays || parseInt(customDays) <= 0}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
          >
            Set
          </button>
        </div>
      )}
    </div>
  );
}
