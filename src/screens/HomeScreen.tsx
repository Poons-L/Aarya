import { Search, Plus, Bell, Settings, Brain, Mic, FileText, Image as ImageIcon, Clock, Calendar } from 'lucide-react';
import { Contact } from '../hooks/useContacts';
import { Reminder } from '../hooks/useReminders';
import { Memory } from '../hooks/useMemories';

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
  onSelectMemory: (memoryId: string) => void;
  onSelectContact: (contactId: string) => void;
  contacts: Contact[];
  reminders: Reminder[];
  memories: Memory[];
}

export function HomeScreen({ onNavigate, onSelectMemory, onSelectContact, contacts, reminders, memories }: HomeScreenProps) {
  const upcomingReminders = reminders.filter(r => !r.completed).length;
  const recentMemories = memories.slice(0, 10);

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'voice':
        return <Mic size={16} />;
      case 'ocr':
        return <ImageIcon size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffInHours = Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col">
      <div className="bg-gradient-to-br from-orange-500 to-amber-600 px-6 pt-14 pb-8 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Re.Me</h1>
            <p className="text-orange-100 text-sm">Your AI Memory Assistant</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => alert('Calendar integration coming soon! This will sync with Google Calendar, Outlook, and Apple Calendar.')}
              className="p-2.5 bg-white/20 backdrop-blur-sm rounded-full active:scale-95 transition-transform"
              aria-label="Calendar (coming soon)"
            >
              <Calendar size={20} className="text-white" />
            </button>
            <button
              onClick={() => onNavigate('reminders')}
              className="relative p-2.5 bg-white/20 backdrop-blur-sm rounded-full active:scale-95 transition-transform"
              aria-label="View reminders"
            >
              <Bell size={20} className="text-white" />
              {upcomingReminders > 0 && (
                <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {upcomingReminders}
                </span>
              )}
            </button>
            <button
              onClick={() => onNavigate('settings')}
              className="p-2.5 bg-white/20 backdrop-blur-sm rounded-full active:scale-95 transition-transform"
              aria-label="Settings"
            >
              <Settings size={20} className="text-white" />
            </button>
          </div>
        </div>

        <div className="relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search memories, people, topics..."
            className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl shadow-md focus:outline-none focus:ring-2 focus:ring-orange-300"
            onFocus={() => onNavigate('search')}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => onNavigate('search')}
            className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 active:bg-slate-50 transition-colors text-left"
          >
            <Brain size={24} className="text-orange-500 mb-2" />
            <div className="text-2xl font-bold text-slate-900">{memories.length}</div>
            <div className="text-xs text-slate-600">Memories</div>
          </button>
          <button
            onClick={() => onNavigate('contacts')}
            className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 active:bg-slate-50 transition-colors text-left"
          >
            <Search size={24} className="text-orange-500 mb-2" />
            <div className="text-2xl font-bold text-slate-900">{contacts.length}</div>
            <div className="text-xs text-slate-600">People</div>
          </button>
          <button
            onClick={() => onNavigate('reminders')}
            className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 active:bg-slate-50 transition-colors text-left"
          >
            <Bell size={24} className="text-orange-500 mb-2" />
            <div className="text-2xl font-bold text-slate-900">{upcomingReminders}</div>
            <div className="text-xs text-slate-600">Follow-ups</div>
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
            {recentMemories.length > 5 && (
              <button
                onClick={() => onNavigate('search')}
                className="text-sm text-orange-600 font-semibold"
              >
                View All
              </button>
            )}
          </div>

          {recentMemories.length > 0 ? (
            <div className="space-y-3">
              {recentMemories.map((memory) => (
                <button
                  key={memory.id}
                  onClick={() => onSelectMemory(memory.id)}
                  className="w-full bg-white rounded-2xl p-4 shadow-sm border border-slate-100 active:bg-slate-50 transition-colors text-left"
                >
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-400 rounded-full flex items-center justify-center text-white flex-shrink-0">
                      {getSourceIcon(memory.source_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Clock size={12} />
                          {formatTimeAgo(memory.created_at)}
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 line-clamp-2">
                        {memory.summary || memory.text}
                      </p>
                    </div>
                  </div>
                  {memory.tags && memory.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {memory.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="text-xs bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-slate-300">
              <Brain size={48} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 mb-2 font-medium">No memories yet</p>
              <p className="text-sm text-slate-500">
                Start capturing conversations, notes, and meetings below
              </p>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Capture</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onNavigate('add-memory')}
              className="bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-2xl p-6 shadow-lg active:scale-95 transition-transform"
            >
              <Brain size={28} className="mb-2" />
              <div className="font-semibold">New Memory</div>
              <div className="text-xs text-orange-100 mt-1">Voice, text, or photo</div>
            </button>
            <button
              onClick={() => onNavigate('add-contact')}
              className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-2xl p-6 shadow-lg active:scale-95 transition-transform"
            >
              <Plus size={28} className="mb-2" />
              <div className="font-semibold">Add Person</div>
              <div className="text-xs text-cyan-100 mt-1">Save contact details</div>
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Events & Agenda</h2>
          <button
            onClick={() => onNavigate('events-agenda')}
            className="w-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-6 shadow-lg active:scale-95 transition-transform text-left"
          >
            <div className="flex items-center justify-between mb-3">
              <Calendar size={32} />
              <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full">
                PREVIEW
              </span>
            </div>
            <div className="font-bold text-lg mb-1">Events & Sessions</div>
            <div className="text-sm text-emerald-100">
              Import schedules, plan meetings, and manage event agendas
            </div>
          </button>
        </div>
      </div>

      <div className="bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-around">
        <button className="flex flex-col items-center gap-1 text-orange-600">
          <Brain size={24} />
          <span className="text-xs font-medium">Home</span>
        </button>
        <button
          onClick={() => onNavigate('search')}
          className="flex flex-col items-center gap-1 text-slate-400"
        >
          <Search size={24} />
          <span className="text-xs font-medium">Search</span>
        </button>
        <button
          onClick={() => onNavigate('add-memory')}
          className="flex flex-col items-center gap-1 text-slate-400"
        >
          <div className="w-12 h-12 -mt-6 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg">
            <Plus size={28} className="text-white" />
          </div>
        </button>
        <button
          onClick={() => onNavigate('reminders')}
          className="flex flex-col items-center gap-1 text-slate-400 relative"
        >
          <Bell size={24} />
          <span className="text-xs font-medium">Reminders</span>
          {upcomingReminders > 0 && (
            <span className="absolute top-0 right-2 bg-pink-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {upcomingReminders}
            </span>
          )}
        </button>
        <button
          onClick={() => onNavigate('settings')}
          className="flex flex-col items-center gap-1 text-slate-400"
        >
          <Settings size={24} />
          <span className="text-xs font-medium">Settings</span>
        </button>
      </div>
    </div>
  );
}
