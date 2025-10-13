import { useState } from 'react';
import { Search, Plus, Bell, Settings, Users, Calendar, TrendingUp } from 'lucide-react';
import { Contact } from '../hooks/useContacts';
import { Reminder } from '../hooks/useReminders';

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
  contacts: Contact[];
  reminders: Reminder[];
}

export function HomeScreen({ onNavigate, contacts, reminders }: HomeScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const recentContacts = contacts.slice(0, 5);
  const upcomingReminders = reminders.filter(r => !r.completed).length;

  return (
    <div className="h-full bg-slate-50 flex flex-col">
      <div className="bg-gradient-to-br from-orange-500 to-amber-600 px-6 pt-14 pb-8 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Re.Me</h1>
            <p className="text-orange-100 text-sm">Your Networking Hub</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('reminders')}
              className="relative p-2.5 bg-white/20 backdrop-blur-sm rounded-full active:scale-95 transition-transform"
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
            >
              <Settings size={20} className="text-white" />
            </button>
          </div>
        </div>

        <div className="relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts..."
            className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl shadow-md focus:outline-none focus:ring-2 focus:ring-orange-300"
            onFocus={() => onNavigate('contacts')}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <Users size={24} className="text-orange-500 mb-2" />
            <div className="text-2xl font-bold text-slate-900">{contacts.length}</div>
            <div className="text-xs text-slate-600">Contacts</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <Calendar size={24} className="text-orange-500 mb-2" />
            <div className="text-2xl font-bold text-slate-900">{upcomingReminders}</div>
            <div className="text-xs text-slate-600">Reminders</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <TrendingUp size={24} className="text-orange-500 mb-2" />
            <div className="text-2xl font-bold text-slate-900">12</div>
            <div className="text-xs text-slate-600">This Week</div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Recent Contacts</h2>
            <button
              onClick={() => onNavigate('contacts')}
              className="text-sm text-orange-600 font-semibold"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {recentContacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => onNavigate('contact-detail')}
                className="w-full bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-4 active:scale-98 transition-transform"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-400 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                  {contact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-slate-900">{contact.name}</div>
                  <div className="text-sm text-slate-600">{contact.company}</div>
                </div>
                <div className="text-xs text-slate-500">
                  {new Date(contact.met_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onNavigate('add-contact')}
              className="bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-2xl p-6 shadow-lg active:scale-95 transition-transform"
            >
              <Plus size={28} className="mb-2" />
              <div className="font-semibold">Add Contact</div>
            </button>
            <button
              onClick={() => onNavigate('record-conversation')}
              className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-2xl p-6 shadow-lg active:scale-95 transition-transform"
            >
              <div className="w-7 h-7 bg-white/30 rounded-full flex items-center justify-center mb-2">
                <div className="w-4 h-4 bg-white rounded-full"></div>
              </div>
              <div className="font-semibold">Record Chat</div>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-around">
        <button className="flex flex-col items-center gap-1 text-orange-600">
          <Users size={24} />
          <span className="text-xs font-medium">Home</span>
        </button>
        <button
          onClick={() => onNavigate('contacts')}
          className="flex flex-col items-center gap-1 text-slate-400"
        >
          <Search size={24} />
          <span className="text-xs font-medium">Search</span>
        </button>
        <button
          onClick={() => onNavigate('add-contact')}
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
