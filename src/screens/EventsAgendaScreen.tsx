import { useState } from 'react';
import { ArrowLeft, Calendar, MapPin, Clock, Users, Upload, Plus, Info, Home } from 'lucide-react';

interface EventsAgendaScreenProps {
  onBack: () => void;
  onHome: () => void;
}

export function EventsAgendaScreen({ onBack, onHome }: EventsAgendaScreenProps) {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showComingSoonToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const mockEvent = {
    id: '1',
    title: 'AI Summit 2025',
    dateRange: 'May 14–16, 2025',
    location: 'Singapore',
    status: 'coming_soon' as const,
  };

  const mockSession = {
    id: '1',
    eventId: '1',
    title: 'GenAI in Go-To-Market',
    startTime: 'May 15, 10:30',
    endTime: '11:15',
    room: 'Hall B',
    tags: ['AI', 'Marketing', 'Strategy'],
  };

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
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full">
            <Info size={14} className="text-amber-600" />
            <span className="text-xs font-semibold text-amber-700">Preview Mode</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-1">Events & Agenda</h1>
        <p className="text-sm text-slate-600 mb-4">
          Re.Me will import event schedules, let you add sessions to your calendar, and plan meetings here.
        </p>

        <div className="flex gap-2">
          <button
            onClick={() => showComingSoonToast('Coming soon — this will let you import schedules via CSV or API.')}
            disabled
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-100 text-slate-400 rounded-xl font-medium cursor-not-allowed"
          >
            <Upload size={16} />
            Import Schedule
          </button>
          <button
            onClick={() => showComingSoonToast('Coming soon — we\'ll notify you when this feature is ready!')}
            disabled
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-100 text-slate-400 rounded-xl font-medium cursor-not-allowed"
          >
            <Calendar size={16} />
            Notify Me
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wide">Upcoming Events</h2>
            <span className="text-xs text-slate-500">1 event</span>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-400 rounded-xl flex flex-col items-center justify-center text-white flex-shrink-0">
                <div className="text-xs font-semibold uppercase">May</div>
                <div className="text-2xl font-bold">14</div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 mb-1">{mockEvent.title}</h3>

                <div className="flex items-center gap-1.5 text-sm text-slate-600 mb-1">
                  <Calendar size={14} />
                  <span>{mockEvent.dateRange}</span>
                </div>

                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                  <MapPin size={14} />
                  <span>{mockEvent.location}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => showComingSoonToast('Coming soon — this will show all sessions for this event.')}
              disabled
              className="w-full py-3 bg-slate-100 text-slate-400 rounded-xl font-semibold cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Calendar size={18} />
              Preview Sessions
              <span className="text-xs bg-slate-200 px-2 py-0.5 rounded-full">Disabled</span>
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wide">Featured Sessions</h2>
            <span className="text-xs text-slate-500">Sample preview</span>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
            <div className="mb-4">
              <h3 className="font-bold text-slate-900 mb-2">{mockSession.title}</h3>

              <div className="flex items-center gap-1.5 text-sm text-slate-600 mb-1">
                <Clock size={14} />
                <span>{mockSession.startTime}–{mockSession.endTime}</span>
              </div>

              <div className="flex items-center gap-1.5 text-sm text-slate-600 mb-3">
                <MapPin size={14} />
                <span>{mockSession.room}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {mockSession.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => showComingSoonToast('Coming soon — this will connect to your native Calendar.')}
                disabled
                className="w-full py-2.5 bg-slate-100 text-slate-400 rounded-lg font-medium cursor-not-allowed flex items-center justify-center gap-2 relative group"
              >
                <Calendar size={16} />
                Add to Calendar
                <span className="text-xs bg-slate-200 px-2 py-0.5 rounded-full">Coming Soon</span>
              </button>

              <button
                onClick={() => showComingSoonToast('Coming soon — this will let you propose 1-1 meeting slots.')}
                disabled
                className="w-full py-2.5 bg-slate-100 text-slate-400 rounded-lg font-medium cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Users size={16} />
                Plan 1-1 Meeting
                <span className="text-xs bg-slate-200 px-2 py-0.5 rounded-full">Coming Soon</span>
              </button>

              <button
                onClick={() => showComingSoonToast('Coming soon — this will create a follow-up reminder.')}
                disabled
                className="w-full py-2.5 bg-slate-100 text-slate-400 rounded-lg font-medium cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Schedule Follow-up (15m)
                <span className="text-xs bg-slate-200 px-2 py-0.5 rounded-full">Coming Soon</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-100">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Calendar size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 mb-1">Coming Soon</h3>
              <p className="text-sm text-slate-600">
                Event management features are under development. You'll be able to:
              </p>
            </div>
          </div>

          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex items-start gap-2">
              <span className="text-orange-500 font-bold">•</span>
              <span>Import event schedules from CSV files or event platforms</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 font-bold">•</span>
              <span>Sync sessions with your native calendar (Google, Outlook, Apple)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 font-bold">•</span>
              <span>Schedule 1-1 meetings with contacts you meet at events</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 font-bold">•</span>
              <span>Set automatic follow-up reminders after sessions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 font-bold">•</span>
              <span>Link contacts and memories to specific events and sessions</span>
            </li>
          </ul>
        </div>
      </div>

      {showToast && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 px-6 py-3 bg-slate-900 text-white rounded-xl shadow-lg max-w-sm text-center text-sm font-medium animate-fade-in z-50">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
