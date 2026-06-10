import { useState } from 'react';
import { AlertCircle, Calendar, Clock, Plus, Sparkles, ChevronRight, Gift, MessageCircle, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useContacts, Contact } from '../hooks/useContacts';
import { useReminders } from '../hooks/useReminders';

interface NewHomeScreenProps {
  onNavigate: (screen: string) => void;
  onViewContact: (contactId: string) => void;
}

function getDaysUntilBirthday(birthday: string): number {
  const [month, day] = birthday.split('-').map(Number);
  const now = new Date();
  const thisYear = now.getFullYear();
  let nextBirthday = new Date(thisYear, month - 1, day);
  if (nextBirthday < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
    nextBirthday = new Date(thisYear + 1, month - 1, day);
  }
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function SuggestedMessageModal({ contact, onClose }: { contact: Contact; onClose: () => void }) {
  const { session } = useAuth();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generateMessage = async () => {
    setLoading(true);
    try {
      if (!session?.access_token) {
        setMessage(`Hey ${contact.name.split(' ')[0]}, thinking of you as your birthday comes up — how have things been going${contact.company ? ` at ${contact.company}` : ''}?`);
        setGenerated(true);
        return;
      }

      const lastInteraction = contact.interaction_history && contact.interaction_history.length > 0
        ? contact.interaction_history[contact.interaction_history.length - 1]
        : null;

      const context = {
        name: contact.name,
        title: contact.title || '',
        company: contact.company || '',
        notes: contact.notes || '',
        last_interaction: lastInteraction ? lastInteraction.note : '',
        last_interaction_date: lastInteraction ? lastInteraction.date : '',
      };

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-conversation-starters`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contact_id: contact.id,
          prompt_type: 'birthday_reconnect',
          context,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.starters && data.starters.length > 0) {
          setMessage(data.starters[0]);
        } else if (data.message) {
          setMessage(data.message);
        } else {
          setMessage(buildFallbackMessage(contact));
        }
      } else {
        setMessage(buildFallbackMessage(contact));
      }
    } catch {
      setMessage(buildFallbackMessage(contact));
    } finally {
      setLoading(false);
      setGenerated(true);
    }
  };

  const buildFallbackMessage = (c: Contact): string => {
    const firstName = c.name.split(' ')[0];
    const lastInteraction = c.interaction_history && c.interaction_history.length > 0
      ? c.interaction_history[c.interaction_history.length - 1]
      : null;

    if (lastInteraction && lastInteraction.note) {
      const topicSnippet = lastInteraction.note.length > 50
        ? lastInteraction.note.slice(0, 50) + '...'
        : lastInteraction.note;
      return `Hey ${firstName}, thinking of you as your birthday comes up! Last time we talked about "${topicSnippet}" — how's that been going? Would love to catch up.`;
    }
    if (c.title && c.company) {
      return `Hey ${firstName}, thinking of you as your birthday comes up — how has the ${c.title} role at ${c.company} been treating you? Would love to reconnect.`;
    }
    if (c.company) {
      return `Hey ${firstName}, thinking of you as your birthday comes up — how are things going at ${c.company}? Would love to catch up soon.`;
    }
    return `Hey ${firstName}, thinking of you as your birthday comes up — it's been a while! Would love to reconnect and hear what you've been up to.`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-[430px] bg-white rounded-t-2xl p-5 pb-8 animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Gift size={18} className="text-orange-500" />
            <h3 className="font-semibold text-slate-900">Reconnect Message</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400">
            <X size={20} />
          </button>
        </div>

        <p className="text-xs text-slate-500 mb-3">
          A personalized message to reconnect with {contact.name.split(' ')[0]} around their birthday — not a generic "Happy Birthday!"
        </p>

        {!generated && (
          <button
            onClick={generateMessage}
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-3 rounded-xl font-medium active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Crafting message...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Sparkles size={18} />
                Generate Suggested Message
              </span>
            )}
          </button>
        )}

        {generated && message && (
          <div className="space-y-3">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-sm text-slate-700 leading-relaxed">{message}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 bg-orange-500 text-white py-2.5 rounded-lg text-sm font-medium active:scale-[0.98] transition-transform"
              >
                Copy Message
              </button>
              <button
                onClick={generateMessage}
                disabled={loading}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium active:scale-[0.98] transition-transform disabled:opacity-50"
              >
                {loading ? '...' : 'Regenerate'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function NewHomeScreen({ onNavigate, onViewContact }: NewHomeScreenProps) {
  const { profile } = useAuth();
  const { contacts } = useContacts();
  const { reminders } = useReminders();
  const [birthdayMessageContact, setBirthdayMessageContact] = useState<Contact | null>(null);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sixtyDaysAgo = new Date(today);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  // Needs Attention: overdue reminders OR contacts with no recent interaction (30+ days)
  const overdueReminders = reminders
    .filter(r => !r.completed && new Date(r.due_date) < now)
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

  const staleContacts = contacts.filter(c => {
    const lastInteraction = c.last_contact ? new Date(c.last_contact) : new Date(c.created_at);
    return lastInteraction < thirtyDaysAgo;
  });

  // Birthday reactivation: birthday within 14 days AND last interaction 60+ days ago
  const birthdayReactivationContacts = contacts.filter(c => {
    if (!c.birthday) return false;
    const daysUntil = getDaysUntilBirthday(c.birthday);
    if (daysUntil > 14) return false;
    const lastInteraction = c.last_contact ? new Date(c.last_contact) : new Date(c.created_at);
    return lastInteraction < sixtyDaysAgo;
  }).sort((a, b) => getDaysUntilBirthday(a.birthday!) - getDaysUntilBirthday(b.birthday!));

  const needsAttentionItems: Array<{
    type: 'overdue' | 'stale' | 'birthday';
    contactId?: string;
    contactName: string;
    detail: string;
    contact?: Contact;
  }> = [];

  // Birthday reactivation items go first (high priority timing signal)
  birthdayReactivationContacts.forEach(c => {
    const daysUntil = getDaysUntilBirthday(c.birthday!);
    const lastDate = c.last_contact ? new Date(c.last_contact) : new Date(c.created_at);
    const daysSinceContact = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    needsAttentionItems.push({
      type: 'birthday',
      contactId: c.id,
      contactName: c.name,
      detail: `Birthday in ${daysUntil} day${daysUntil !== 1 ? 's' : ''} · Haven't spoken in ${daysSinceContact} days`,
      contact: c,
    });
  });

  overdueReminders.forEach(r => {
    const contact = r.contact_id ? contacts.find(c => c.id === r.contact_id) : null;
    needsAttentionItems.push({
      type: 'overdue',
      contactId: r.contact_id || undefined,
      contactName: contact?.name || 'Unknown',
      detail: r.title,
    });
  });

  // Exclude contacts already shown via birthday trigger from stale list
  const birthdayIds = new Set(birthdayReactivationContacts.map(c => c.id));
  staleContacts
    .filter(c => !birthdayIds.has(c.id))
    .slice(0, 5)
    .forEach(c => {
      const lastDate = c.last_contact ? new Date(c.last_contact) : new Date(c.created_at);
      const daysAgo = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      needsAttentionItems.push({
        type: 'stale',
        contactId: c.id,
        contactName: c.name,
        detail: `No contact in ${daysAgo} days`,
      });
    });

  // Next Meeting: upcoming reminders today or tomorrow
  const nextMeetings = reminders
    .filter(r => {
      if (r.completed) return false;
      const dueDate = new Date(r.due_date);
      return dueDate >= today && dueDate < dayAfterTomorrow;
    })
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 3);

  // Recent Contacts
  const recentContacts = contacts
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const getGreeting = () => {
    const hour = now.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    if (date.toDateString() === today.toDateString()) {
      return 'Today' + (date.getHours() !== 0 ? ` at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` : '');
    }
    return 'Tomorrow' + (date.getHours() !== 0 ? ` at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` : '');
  };

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto pb-24">
        {/* Header */}
        <div className="px-6 pt-8 pb-2">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {getGreeting()}
                {profile?.full_name && `, ${profile.full_name.split(' ')[0]}`}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {now.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            {profile?.avatar_url && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onNavigate('profile');
                }}
                className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-orange-400"
              >
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </button>
            )}
          </div>
        </div>

        {/* Needs Attention Section */}
        {needsAttentionItems.length > 0 && (
          <div className="px-6 mt-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <h2 className="text-sm font-semibold text-slate-800">Needs Attention</h2>
              <span className="ml-auto text-xs text-slate-500">{needsAttentionItems.length} items</span>
            </div>
            <div className="space-y-2">
              {needsAttentionItems.slice(0, 5).map((item, index) => (
                <div key={index} className="w-full bg-white rounded-xl p-3.5 shadow-sm border border-slate-200 text-left">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (item.contactId) onViewContact(item.contactId);
                      }}
                      className="flex items-center gap-3 flex-1 min-w-0 active:scale-[0.98] transition-transform"
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                        item.type === 'overdue'
                          ? 'bg-red-50'
                          : item.type === 'birthday'
                          ? 'bg-orange-50'
                          : 'bg-amber-50'
                      }`}>
                        {item.type === 'overdue' ? (
                          <AlertCircle size={18} className="text-red-500" />
                        ) : item.type === 'birthday' ? (
                          <Gift size={18} className="text-orange-500" />
                        ) : (
                          <Clock size={18} className="text-amber-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 text-sm truncate">
                          {item.contactName}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {item.detail}
                        </div>
                      </div>
                    </button>
                    {item.type === 'birthday' && item.contact && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setBirthdayMessageContact(item.contact!);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-orange-50 border border-orange-200 rounded-lg text-xs font-medium text-orange-700 active:scale-95 transition-transform flex-shrink-0"
                      >
                        <MessageCircle size={12} />
                        <span>Message</span>
                      </button>
                    )}
                    {item.type !== 'birthday' && (
                      <ChevronRight size={16} className="text-slate-400 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
              {needsAttentionItems.length > 5 && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onNavigate('reminders');
                  }}
                  className="w-full text-center text-xs text-orange-600 font-medium py-2"
                >
                  View all {needsAttentionItems.length} items
                </button>
              )}
            </div>
          </div>
        )}

        {/* Next Meeting Section */}
        {nextMeetings.length > 0 && (
          <div className="px-6 mt-6">
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={16} className="text-orange-500" />
              <h2 className="text-sm font-semibold text-slate-800">Coming Up</h2>
            </div>
            <div className="space-y-2">
              {nextMeetings.map(reminder => {
                const contact = reminder.contact_id
                  ? contacts.find(c => c.id === reminder.contact_id)
                  : null;

                return (
                  <button
                    key={reminder.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (contact) onViewContact(contact.id);
                    }}
                    className="w-full bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl p-4 border border-orange-100 active:scale-[0.98] transition-transform text-left"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {contact?.photo_url ? (
                          <img
                            src={contact.photo_url}
                            alt={contact.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          contact ? contact.name[0] : '?'
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900 text-sm">
                          {reminder.title}
                        </div>
                        <div className="text-xs text-orange-700 mt-0.5">
                          {formatTime(reminder.due_date)}
                          {contact && ` with ${contact.name}`}
                        </div>
                        {reminder.description && (
                          <div className="mt-2 text-xs text-slate-600 bg-white/70 rounded-lg px-2.5 py-1.5 border border-orange-100">
                            <Sparkles size={10} className="inline text-orange-400 mr-1" />
                            {reminder.description.length > 80
                              ? reminder.description.slice(0, 80) + '...'
                              : reminder.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state when nothing urgent */}
        {needsAttentionItems.length === 0 && nextMeetings.length === 0 && contacts.length > 0 && (
          <div className="px-6 mt-4">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-100 text-center">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Sparkles size={20} className="text-emerald-600" />
              </div>
              <p className="text-sm font-medium text-emerald-800">You're all caught up!</p>
              <p className="text-xs text-emerald-600 mt-1">No overdue items or upcoming meetings</p>
            </div>
          </div>
        )}

        {/* Recent Contacts */}
        {recentContacts.length > 0 && (
          <div className="px-6 mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-800">Recent Contacts</h2>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onNavigate('contacts');
                }}
                className="text-xs text-orange-600 font-medium"
              >
                View All
              </button>
            </div>
            <div className="space-y-2">
              {recentContacts.map(contact => (
                <button
                  key={contact.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onViewContact(contact.id);
                  }}
                  className="w-full bg-white rounded-xl p-3 shadow-sm border border-slate-200 active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
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
                      <div className="font-medium text-slate-900 text-sm truncate">
                        {contact.name}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {contact.title && contact.company
                          ? `${contact.title} at ${contact.company}`
                          : contact.company || contact.title || 'No title'}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-300" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty state for new users */}
        {contacts.length === 0 && (
          <div className="px-6 mt-8">
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-200">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus size={32} className="text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Start building your network
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Add your first contact to get personalized prep before every meeting
              </p>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onNavigate('addContact');
                }}
                className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-6 py-2.5 rounded-lg font-medium active:scale-95 transition-transform"
              >
                Add First Contact
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button - Quick Capture */}
      <div className="absolute bottom-20 right-5 z-10">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onNavigate('quickCapture');
          }}
          className="w-14 h-14 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full shadow-lg shadow-orange-500/30 flex items-center justify-center active:scale-90 transition-transform"
        >
          <Plus size={28} className="text-white" />
        </button>
        <span className="absolute -top-7 right-0 text-[10px] font-medium text-slate-500 whitespace-nowrap">Quick Capture</span>
      </div>

      {/* Birthday Message Modal */}
      {birthdayMessageContact && (
        <SuggestedMessageModal
          contact={birthdayMessageContact}
          onClose={() => setBirthdayMessageContact(null)}
        />
      )}
    </div>
  );
}
