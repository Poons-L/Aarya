import { useState } from 'react';
import { ArrowLeft, Mail, Phone, Linkedin, MapPin, Calendar, Tag, CreditCard as Edit2, MessageCircle, Sparkles, Plus, Clock, Send, ExternalLink, CalendarPlus, Download, User, ChevronDown } from 'lucide-react';
import { useContacts } from '../hooks/useContacts';
import { downloadVCard, generateHubSpotCSV, generateSalesforceCSV, downloadCSV, createMailtoLink, createCalendarEvent } from '../utils/contactExport';

interface NewContactDetailScreenProps {
  contactId: string;
  onBack: () => void;
  onEditContact: (contactId: string) => void;
  onAddReminder: (contactId: string) => void;
}

export function NewContactDetailScreen({ contactId, onBack, onEditContact, onAddReminder }: NewContactDetailScreenProps) {
  const { contacts, updateContact } = useContacts();
  const contact = contacts.find(c => c.id === contactId);
  const [showAIStarters, setShowAIStarters] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiStarters, setAIStarters] = useState<string[]>([]);
  const [newInteraction, setNewInteraction] = useState('');
  const [showAddInteraction, setShowAddInteraction] = useState(false);
  const [showCRMExport, setShowCRMExport] = useState(false);

  console.log('NewContactDetailScreen rendered with contactId:', contactId);
  console.log('Contacts array length:', contacts.length);
  console.log('Found contact:', contact);

  if (!contact) {
    console.log('Contact not found! Calling onBack()');
    return (
      <div className="h-full bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Contact not found</p>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onBack();
            }}
            className="bg-orange-500 text-white px-6 py-2 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const interactionHistory = contact.interaction_history || [];

  const generateAIStarters = async () => {
    setGeneratingAI(true);
    setShowAIStarters(true);

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY;

    if (!apiKey) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAIStarters([
        'AI feature requires an OpenAI API key to be configured.',
        'Please add OPENAI_API_KEY to your environment variables.',
        'This feature will generate personalized conversation starters based on the contact\'s profile.'
      ]);
      setGeneratingAI(false);
      return;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{
            role: 'user',
            content: `Generate 3 personalized conversation starters for reconnecting with this contact:
Name: ${contact.name}
Company: ${contact.company || 'Unknown'}
Title: ${contact.title || 'Unknown'}
Notes: ${contact.notes || 'None'}
Met at: ${contact.met_at || 'Unknown'}

Provide 3 specific, personalized conversation starters that reference their work, interests, or context. Keep each under 100 characters. Return as a JSON array of strings.`
          }],
          temperature: 0.7,
          max_tokens: 300
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0].message.content;
        try {
          const parsed = JSON.parse(content);
          setAIStarters(Array.isArray(parsed) ? parsed : [content]);
        } catch {
          setAIStarters([content]);
        }
      } else {
        setAIStarters([
          'Unable to generate AI conversation starters.',
          'Please check your API key and try again.'
        ]);
      }
    } catch (error) {
      setAIStarters([
        'Error connecting to AI service.',
        'Please check your internet connection and try again.'
      ]);
    } finally {
      setGeneratingAI(false);
    }
  };

  const addInteractionNote = async () => {
    if (!newInteraction.trim()) return;

    const updatedHistory = [
      ...(Array.isArray(interactionHistory) ? interactionHistory : []),
      {
        date: new Date().toISOString(),
        note: newInteraction.trim(),
        type: 'note'
      }
    ];

    await updateContact(contact.id, {
      interaction_history: updatedHistory,
      last_contact: new Date().toISOString()
    });

    setNewInteraction('');
    setShowAddInteraction(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const handleSendEmail = () => {
    if (!contact.email) return;
    const mailto = createMailtoLink(contact.email, `Following up`, `Hi ${contact.name.split(' ')[0]},\n\n`);
    window.location.href = mailto;
  };

  const handleViewLinkedIn = () => {
    if (!contact.linkedin_url) return;
    window.open(contact.linkedin_url, '_blank');
  };

  const handleScheduleMeeting = () => {
    const calendarUrl = createCalendarEvent(contact.name, contact.email);
    window.open(calendarUrl, '_blank');
  };

  const handleExportHubSpot = () => {
    const csv = generateHubSpotCSV(contact);
    downloadCSV(csv, `${contact.name.replace(/\s+/g, '_')}_HubSpot.csv`);
    setShowCRMExport(false);
  };

  const handleExportSalesforce = () => {
    const csv = generateSalesforceCSV(contact);
    downloadCSV(csv, `${contact.name.replace(/\s+/g, '_')}_Salesforce.csv`);
    setShowCRMExport(false);
  };

  const handleSaveAsContact = () => {
    downloadVCard(contact);
  };

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onBack();
          }}
          className="text-slate-600 active:text-slate-900"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-semibold text-slate-900">Contact Details</h1>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEditContact(contactId);
          }}
          className="text-orange-600 active:text-orange-800"
        >
          <Edit2 size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-4xl font-semibold overflow-hidden mb-4">
              {contact.photo_url ? (
                <img
                  src={contact.photo_url}
                  alt={contact.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                contact.name[0]
              )}
            </div>
            <h2 className="text-2xl font-bold text-slate-900 text-center">
              {contact.name}
            </h2>
            {(contact.title || contact.company) && (
              <p className="text-slate-600 text-center mt-1">
                {contact.title && contact.company
                  ? `${contact.title} at ${contact.company}`
                  : contact.company || contact.title}
              </p>
            )}
          </div>

          {(contact.email || contact.phone || contact.linkedin_url) && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 mb-4 space-y-3">
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="flex items-center gap-3 text-slate-700 active:text-orange-600"
                >
                  <Mail size={20} className="text-orange-500" />
                  <span className="text-sm">{contact.email}</span>
                </a>
              )}
              {contact.phone && (
                <a
                  href={`tel:${contact.phone}`}
                  className="flex items-center gap-3 text-slate-700 active:text-orange-600"
                >
                  <Phone size={20} className="text-orange-500" />
                  <span className="text-sm">{contact.phone}</span>
                </a>
              )}
              {contact.linkedin_url && (
                <a
                  href={contact.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-slate-700 active:text-orange-600"
                >
                  <Linkedin size={20} className="text-orange-500" />
                  <span className="text-sm">LinkedIn Profile</span>
                </a>
              )}
            </div>
          )}

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              generateAIStarters();
            }}
            disabled={generatingAI}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-xl shadow-md mb-4 active:scale-98 transition-transform disabled:opacity-50"
          >
            <div className="flex items-center justify-center gap-2">
              <Sparkles size={20} />
              <span className="font-semibold">
                {generatingAI ? 'Generating...' : 'AI Conversation Starters'}
              </span>
            </div>
          </button>

          {showAIStarters && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-200 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={18} className="text-purple-600" />
                <h3 className="font-semibold text-purple-900">Conversation Starters</h3>
              </div>
              <div className="space-y-2">
                {aiStarters.map((starter, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg p-3 text-sm text-slate-700 border border-purple-100"
                  >
                    {starter}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 mb-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSendEmail();
                }}
                disabled={!contact.email}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                  contact.email
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white active:scale-98'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Send size={20} />
                <div className="text-left flex-1">
                  <div className="font-semibold text-sm">Send Email</div>
                  <div className="text-xs opacity-90">
                    {contact.email || 'No email address'}
                  </div>
                </div>
              </button>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleViewLinkedIn();
                }}
                disabled={!contact.linkedin_url}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                  contact.linkedin_url
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white active:scale-98'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <ExternalLink size={20} />
                <div className="text-left flex-1">
                  <div className="font-semibold text-sm">View LinkedIn</div>
                  <div className="text-xs opacity-90">
                    {contact.linkedin_url ? 'Open profile' : 'No LinkedIn saved'}
                  </div>
                </div>
              </button>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleScheduleMeeting();
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white active:scale-98 transition-all"
              >
                <CalendarPlus size={20} />
                <div className="text-left flex-1">
                  <div className="font-semibold text-sm">Schedule Meeting</div>
                  <div className="text-xs opacity-90">Create calendar invite</div>
                </div>
              </button>

              <div className="relative">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowCRMExport(!showCRMExport);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white active:scale-98 transition-all"
                >
                  <Download size={20} />
                  <div className="text-left flex-1">
                    <div className="font-semibold text-sm">Export to CRM</div>
                    <div className="text-xs opacity-90">HubSpot or Salesforce</div>
                  </div>
                  <ChevronDown size={20} className={`transition-transform ${showCRMExport ? 'rotate-180' : ''}`} />
                </button>

                {showCRMExport && (
                  <div className="mt-2 space-y-2 pl-4">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleExportHubSpot();
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 active:scale-98 transition-all"
                    >
                      <Download size={18} />
                      <div className="text-left flex-1">
                        <div className="font-semibold text-sm">Export to HubSpot</div>
                        <div className="text-xs">Download CSV for HubSpot import</div>
                      </div>
                    </button>

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleExportSalesforce();
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 active:scale-98 transition-all"
                    >
                      <Download size={18} />
                      <div className="text-left flex-1">
                        <div className="font-semibold text-sm">Export to Salesforce</div>
                        <div className="text-xs">Download CSV for Salesforce import</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSaveAsContact();
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white active:scale-98 transition-all"
              >
                <User size={20} />
                <div className="text-left flex-1">
                  <div className="font-semibold text-sm">Save as Contact</div>
                  <div className="text-xs opacity-90">Download vCard (.vcf)</div>
                </div>
              </button>
            </div>
          </div>

          {(contact.met_at || contact.met_date) && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 mb-4 space-y-3">
              {contact.met_at && (
                <div className="flex items-center gap-3">
                  <MapPin size={20} className="text-orange-500" />
                  <div>
                    <div className="text-xs text-slate-500">Where we met</div>
                    <div className="text-sm text-slate-900 font-medium capitalize">
                      {contact.met_at}
                    </div>
                  </div>
                </div>
              )}
              {contact.met_date && (
                <div className="flex items-center gap-3">
                  <Calendar size={20} className="text-orange-500" />
                  <div>
                    <div className="text-xs text-slate-500">Date met</div>
                    <div className="text-sm text-slate-900 font-medium">
                      {formatDate(contact.met_date)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {contact.tags && Array.isArray(contact.tags) && contact.tags.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Tag size={18} className="text-orange-500" />
                <h3 className="text-sm font-semibold text-slate-700">Tags</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {contact.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {contact.notes && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle size={18} className="text-orange-500" />
                <h3 className="text-sm font-semibold text-slate-700">Notes</h3>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{contact.notes}</p>
            </div>
          )}

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-orange-500" />
                <h3 className="text-sm font-semibold text-slate-700">Interaction History</h3>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowAddInteraction(!showAddInteraction);
                }}
                className="text-orange-600 active:text-orange-800"
              >
                <Plus size={20} />
              </button>
            </div>

            {showAddInteraction && (
              <div className="mb-3 space-y-2">
                <textarea
                  value={newInteraction}
                  onChange={(e) => setNewInteraction(e.target.value)}
                  placeholder="Add a note about your interaction..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addInteractionNote();
                  }}
                  disabled={!newInteraction.trim()}
                  className="w-full bg-orange-500 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50 active:scale-98 transition-transform"
                >
                  Add Note
                </button>
              </div>
            )}

            {Array.isArray(interactionHistory) && interactionHistory.length > 0 ? (
              <div className="space-y-2">
                {[...interactionHistory].reverse().map((interaction: any, index) => (
                  <div
                    key={index}
                    className="bg-slate-50 rounded-lg p-3 border border-slate-200"
                  >
                    <div className="text-xs text-slate-500 mb-1">
                      {formatDateTime(interaction.date)}
                    </div>
                    <div className="text-sm text-slate-700">{interaction.note}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">
                No interactions recorded yet
              </p>
            )}
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddReminder(contactId);
            }}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 rounded-xl shadow-md active:scale-98 transition-transform"
          >
            <div className="flex items-center justify-center gap-2">
              <Calendar size={20} />
              <span className="font-semibold">Set Follow-up Reminder</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
