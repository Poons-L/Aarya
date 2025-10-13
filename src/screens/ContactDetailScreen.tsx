import { useState } from 'react';
import { ArrowLeft, Mail, Phone, MapPin, MessageSquare, Calendar, MoreVertical, Edit, Trash2, Bell } from 'lucide-react';
import { Contact, useContacts } from '../hooks/useContacts';
import { useConversations } from '../hooks/useConversations';

interface ContactDetailScreenProps {
  contact: Contact;
  onBack: () => void;
  onEdit: () => void;
  onAddReminder: () => void;
}

export function ContactDetailScreen({ contact, onBack, onEdit, onAddReminder }: ContactDetailScreenProps) {
  const { deleteContact } = useContacts();
  const { conversations } = useConversations(contact.id);
  const [showMenu, setShowMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'notes' | 'conversations'>('notes');

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this contact?')) {
      await deleteContact(contact.id);
      onBack();
    }
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col">
      <div className="relative bg-gradient-to-br from-orange-500 to-amber-600 px-6 pt-14 pb-24">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="p-2 -ml-2 bg-white/20 backdrop-blur-sm rounded-full active:scale-95 transition-transform">
            <ArrowLeft size={24} className="text-white" />
          </button>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 -mr-2 bg-white/20 backdrop-blur-sm rounded-full active:scale-95 transition-transform relative"
          >
            <MoreVertical size={24} className="text-white" />
            {showMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl overflow-hidden z-10">
                <button
                  onClick={onEdit}
                  className="w-full px-4 py-3 flex items-center gap-3 text-slate-700 active:bg-slate-50 transition-colors"
                >
                  <Edit size={18} />
                  <span className="font-medium">Edit Contact</span>
                </button>
                <button
                  onClick={onAddReminder}
                  className="w-full px-4 py-3 flex items-center gap-3 text-slate-700 active:bg-slate-50 transition-colors border-t border-slate-100"
                >
                  <Bell size={18} />
                  <span className="font-medium">Set Reminder</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-3 flex items-center gap-3 text-red-600 active:bg-red-50 transition-colors border-t border-slate-100"
                >
                  <Trash2 size={18} />
                  <span className="font-medium">Delete</span>
                </button>
              </div>
            )}
          </button>
        </div>

        <div className="flex flex-col items-center text-center">
          {contact.photo_url ? (
            <img
              src={contact.photo_url}
              alt={contact.name}
              className="w-24 h-24 rounded-full mb-4 shadow-xl object-cover"
            />
          ) : (
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-orange-600 font-bold text-3xl mb-4 shadow-xl">
              {contact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
          )}
          <h1 className="text-2xl font-bold text-white mb-1">{contact.name}</h1>
          <p className="text-orange-100 text-lg mb-1">{contact.title}</p>
          <p className="text-orange-200 mb-4">{contact.company}</p>
          <div className="flex gap-2">
            {(contact.tags || []).map(tag => (
              <span key={tag} className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 -mt-16 mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-4 grid grid-cols-3 gap-3">
          <a
            href={`mailto:${contact.email}`}
            className="flex flex-col items-center gap-2 py-3 active:bg-slate-50 rounded-xl transition-colors"
          >
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <Mail size={20} className="text-orange-600" />
            </div>
            <span className="text-xs font-medium text-slate-600">Email</span>
          </a>
          <a
            href={`tel:${contact.phone}`}
            className="flex flex-col items-center gap-2 py-3 active:bg-slate-50 rounded-xl transition-colors"
          >
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <Phone size={20} className="text-orange-600" />
            </div>
            <span className="text-xs font-medium text-slate-600">Call</span>
          </a>
          <button className="flex flex-col items-center gap-2 py-3 active:bg-slate-50 rounded-xl transition-colors">
            <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
              <MessageSquare size={20} className="text-pink-600" />
            </div>
            <span className="text-xs font-medium text-slate-600">Message</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 space-y-6 pb-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Contact Information</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Mail size={18} className="text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs text-slate-500 mb-0.5">Email</div>
                <div className="text-sm text-slate-900">{contact.email}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone size={18} className="text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs text-slate-500 mb-0.5">Phone</div>
                <div className="text-sm text-slate-900">{contact.phone}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs text-slate-500 mb-0.5">Met At</div>
                <div className="text-sm text-slate-900">{contact.met_at || 'Not specified'}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {new Date(contact.met_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
                activeTab === 'notes'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              Notes
            </button>
            <button
              onClick={() => setActiveTab('conversations')}
              className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
                activeTab === 'conversations'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              Conversations
            </button>
          </div>

          {activeTab === 'notes' && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Notes</h3>
              <p className="text-sm text-slate-700 leading-relaxed">{contact.notes}</p>
              <button className="mt-4 text-sm text-orange-600 font-semibold">
                Edit Notes
              </button>
            </div>
          )}

          {activeTab === 'conversations' && (
            <div className="space-y-3">
              {conversations.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center">
                  <MessageSquare size={48} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600">No conversations recorded yet</p>
                </div>
              ) : (
                conversations.map(conv => (
                  <div key={conv.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar size={16} className="text-slate-400" />
                      <span className="text-xs text-slate-500">
                        {new Date(conv.conversation_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <h4 className="font-semibold text-slate-900 mb-3">{conv.summary || 'Conversation'}</h4>
                    {conv.key_points && conv.key_points.length > 0 && (
                      <div className="space-y-2">
                        {conv.key_points.map((point, idx) => (
                          <div key={idx} className="flex gap-2">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1.5 flex-shrink-0"></div>
                            <span className="text-sm text-slate-700">{point}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-4 bg-white border-t border-slate-200">
        <button
          onClick={onAddReminder}
          className="w-full bg-gradient-to-br from-orange-500 to-amber-600 text-white font-semibold py-4 rounded-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <Bell size={20} />
          Set Follow-Up Reminder
        </button>
      </div>
    </div>
  );
}
