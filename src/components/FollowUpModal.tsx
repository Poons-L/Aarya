import { X, Calendar } from 'lucide-react';

interface FollowUpModalProps {
  contactName: string;
  onClose: () => void;
  onSetReminder: (days: number) => void;
}

const suggestedDays = [
  { days: 3, label: '3 days', description: 'Quick follow-up' },
  { days: 7, label: '1 week', description: 'Standard check-in' },
  { days: 14, label: '2 weeks', description: 'Professional follow-up' },
  { days: 30, label: '1 month', description: 'Long-term connection' },
];

export function FollowUpModal({ contactName, onClose, onSetReminder }: FollowUpModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-t-3xl w-full max-w-md p-6 animate-slideUp">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-900">Set Follow-Up Reminder</h3>
          <button
            onClick={onClose}
            className="p-2 -mr-2 active:bg-slate-100 rounded-full transition-colors"
          >
            <X size={24} className="text-slate-600" />
          </button>
        </div>

        <p className="text-slate-600 mb-6">
          When would you like to follow up with <span className="font-semibold text-slate-900">{contactName}</span>?
        </p>

        <div className="space-y-3 mb-6">
          {suggestedDays.map(({ days, label, description }) => (
            <button
              key={days}
              onClick={() => onSetReminder(days)}
              className="w-full flex items-center gap-4 p-4 bg-slate-50 border-2 border-slate-200 rounded-xl active:bg-orange-50 active:border-orange-500 transition-colors"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-400 rounded-full flex items-center justify-center flex-shrink-0">
                <Calendar size={20} className="text-white" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-bold text-slate-900">{label}</div>
                <div className="text-sm text-slate-600">{description}</div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 text-slate-600 font-medium active:bg-slate-100 rounded-xl transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
