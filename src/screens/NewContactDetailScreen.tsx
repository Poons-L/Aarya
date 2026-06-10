import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Mail, Phone, Linkedin, MapPin, Calendar, Tag, Pencil, MessageCircle, Sparkles, Plus, Clock, Send, ExternalLink, CalendarPlus, Download, User, ChevronDown, Mic, MicOff, AlertTriangle, RefreshCw, Brain, Lightbulb } from 'lucide-react';
import { useContacts } from '../hooks/useContacts';
import { useReminders } from '../hooks/useReminders';
import { useAuth } from '../contexts/AuthContext';
import { useTalkingPoints } from '../hooks/useTalkingPoints';
import { downloadVCard, generateHubSpotCSV, generateSalesforceCSV, downloadCSV, createMailtoLink, createCalendarEvent } from '../utils/contactExport';

interface NewContactDetailScreenProps {
  contactId: string;
  onBack: () => void;
  onEditContact: (contactId: string) => void;
  onAddReminder: (contactId: string) => void;
  onQuickCapture?: () => void;
}

function SourceChip({ label }: { label: string }) {
  const colors: Record<string, string> = {
    'Contact Record': 'bg-blue-50 text-blue-700 border-blue-200',
    'LinkedIn': 'bg-sky-50 text-sky-700 border-sky-200',
    'Meeting Notes': 'bg-green-50 text-green-700 border-green-200',
    'Interaction History': 'bg-amber-50 text-amber-700 border-amber-200',
    'User Context': 'bg-pink-50 text-pink-700 border-pink-200',
  };
  const colorClass = colors[label] || 'bg-slate-50 text-slate-600 border-slate-200';
  return (
    <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded border ${colorClass}`}>
      {label}
    </span>
  );
}

function ConfidenceBadge({ confidence }: { confidence: 'low' | 'medium' | 'high' }) {
  const styles: Record<string, string> = {
    high: 'bg-green-100 text-green-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-slate-100 text-slate-600',
  };
  return (
    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${styles[confidence]}`}>
      {confidence}
    </span>
  );
}

export function NewContactDetailScreen({ contactId, onBack, onEditContact, onAddReminder, onQuickCapture }: NewContactDetailScreenProps) {
  const { contacts, updateContact } = useContacts();
  const { reminders } = useReminders();
  const { session } = useAuth();
  const { loading: talkingPointsLoading, result: talkingPointsResult, error: talkingPointsError, generate: generateTalkingPoints, enrichContact } = useTalkingPoints();
  const contact = contacts.find(c => c.id === contactId);
  const [newInteraction, setNewInteraction] = useState('');
  const [showAddInteraction, setShowAddInteraction] = useState(false);
  const [showCRMExport, setShowCRMExport] = useState(false);
  const [showAllDetails, setShowAllDetails] = useState(false);
  const [userContextNote, setUserContextNote] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (contact && contact.linkedin_url && !contact.enrichment_status) {
      enrichContact(contactId);
    }
  }, [contact?.linkedin_url, contact?.enrichment_status, contactId, enrichContact]);

  // Auto-generate talking points on load
  useEffect(() => {
    if (contact && !talkingPointsResult && !talkingPointsLoading) {
      generateTalkingPoints(contactId, '', false);
    }
  }, [contactId, contact]);

  if (!contact) {
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
  const lastInteraction = Array.isArray(interactionHistory) && interactionHistory.length > 0
    ? interactionHistory[interactionHistory.length - 1]
    : null;

  // Upcoming reminders for this contact
  const contactReminders = reminders
    .filter(r => r.contact_id === contactId && !r.completed)
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      if (!session?.access_token) {
        alert('Please sign in to use voice transcription.');
        return;
      }

      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        if (data.text) {
          setUserContextNote(prev => prev ? `${prev} ${data.text}` : data.text);
        }
      } else {
        console.error('Transcription failed:', await response.text());
        alert('Transcription failed. Please try again.');
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
      alert('Error transcribing audio. Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleGenerateTalkingPoints = async (forceRefresh = false) => {
    await generateTalkingPoints(contactId, userContextNote, forceRefresh);
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

  const formatRelative = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDate(dateString);
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
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onBack();
          }}
          className="p-1 text-slate-600 active:text-slate-900"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-sm font-semibold overflow-hidden">
            {contact.photo_url ? (
              <img src={contact.photo_url} alt={contact.name} className="w-full h-full object-cover" />
            ) : (
              contact.name[0]
            )}
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-900 leading-tight">{contact.name}</h1>
            {(contact.title || contact.company) && (
              <p className="text-xs text-slate-500">
                {contact.title && contact.company
                  ? `${contact.title} at ${contact.company}`
                  : contact.company || contact.title}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEditContact(contactId);
          }}
          className="p-1 text-orange-600 active:text-orange-800"
        >
          <Pencil size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        <div className="px-5 py-4">

          {/* SECTION 1: Remember This */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={18} className="text-orange-500" />
              <h3 className="text-sm font-semibold text-slate-800">Remember This</h3>
            </div>

            {/* Key notes */}
            {contact.notes && (
              <div className="mb-3">
                <div className="text-xs font-medium text-slate-500 mb-1">Key Notes</div>
                <p className="text-sm text-slate-700 leading-relaxed">{contact.notes}</p>
              </div>
            )}

            {/* Last conversation */}
            {lastInteraction && (
              <div className="mb-3">
                <div className="text-xs font-medium text-slate-500 mb-1">Last Conversation</div>
                <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                  <p className="text-sm text-slate-700">{lastInteraction.note}</p>
                  <p className="text-xs text-slate-400 mt-1">{formatRelative(lastInteraction.date)}</p>
                </div>
              </div>
            )}

            {/* What matters to them - from enrichment or profile keywords */}
            {(contact.profile_current_focus || contact.profile_keywords?.length) && (
              <div>
                <div className="text-xs font-medium text-slate-500 mb-1">What Matters to Them</div>
                {contact.profile_current_focus && (
                  <p className="text-sm text-slate-700 mb-1.5">{contact.profile_current_focus}</p>
                )}
                {contact.profile_keywords && contact.profile_keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {contact.profile_keywords.slice(0, 5).map((kw) => (
                      <span key={kw} className="px-2 py-0.5 bg-orange-50 text-orange-700 rounded-full text-xs border border-orange-100">
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Upcoming reminder for this contact */}
            {contactReminders.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-medium text-orange-600">
                  <Calendar size={12} />
                  <span>Next: {contactReminders[0].title}</span>
                  <span className="text-slate-400 ml-1">
                    ({formatDate(contactReminders[0].due_date)})
                  </span>
                </div>
              </div>
            )}

            {/* Empty state */}
            {!contact.notes && !lastInteraction && !contact.profile_current_focus && !contact.profile_keywords?.length && (
              <p className="text-sm text-slate-400 text-center py-3">
                Add notes or log interactions to build context
              </p>
            )}
          </div>

          {/* SECTION 2: Say This Next - AI Talking Points */}
          <div className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-2xl p-4 border border-orange-100 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Lightbulb size={18} className="text-orange-500" />
                <h3 className="text-sm font-semibold text-slate-800">Say This Next</h3>
              </div>
              {talkingPointsResult?.output && (
                <div className="flex items-center gap-1.5">
                  <ConfidenceBadge confidence={talkingPointsResult.output.confidence} />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleGenerateTalkingPoints(true);
                    }}
                    className="p-1 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
                    title="Refresh"
                  >
                    <RefreshCw size={13} />
                  </button>
                </div>
              )}
            </div>

            {/* Context input */}
            <div className="mb-3">
              <div className="flex gap-2">
                <input
                  value={userContextNote}
                  onChange={(e) => setUserContextNote(e.target.value)}
                  placeholder="Add context (e.g., discussing partnership)"
                  className="flex-1 px-3 py-2 bg-white border border-orange-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  disabled={isRecording || isTranscribing}
                />
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (isRecording) stopRecording();
                    else startRecording();
                  }}
                  disabled={isTranscribing}
                  className={`p-2 rounded-lg transition-all ${
                    isRecording
                      ? 'bg-red-500 text-white animate-pulse'
                      : isTranscribing
                      ? 'bg-slate-300 text-slate-500'
                      : 'bg-orange-500 text-white active:scale-95'
                  } disabled:opacity-50`}
                >
                  {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
              </div>
              {isTranscribing && (
                <p className="text-xs text-orange-600 mt-1">Transcribing...</p>
              )}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleGenerateTalkingPoints(!!userContextNote);
                }}
                disabled={talkingPointsLoading}
                className="mt-2 w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-2.5 rounded-lg text-sm font-medium active:scale-[0.98] transition-transform disabled:opacity-50"
              >
                {talkingPointsLoading ? 'Generating...' : (userContextNote ? 'Generate with Context' : 'Refresh Suggestions')}
              </button>
              {talkingPointsResult?.dailyLimit !== undefined && talkingPointsResult?.dailyLimit !== null && (
                <div className="mt-1.5 text-center text-[10px] text-slate-500">
                  {talkingPointsResult.dailyUsed}/{talkingPointsResult.dailyLimit} today
                </div>
              )}
            </div>

            {/* Loading state */}
            {talkingPointsLoading && (
              <div className="flex items-center justify-center gap-2 py-4">
                <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-orange-700">Preparing suggestions...</span>
              </div>
            )}

            {/* Error state */}
            {!talkingPointsLoading && talkingPointsError && (
              <div className="flex items-center gap-2 text-red-700 bg-red-50 rounded-lg p-3 border border-red-200">
                <AlertTriangle size={16} />
                <span className="text-sm">{talkingPointsError}</span>
              </div>
            )}

            {/* Empty state */}
            {!talkingPointsLoading && !talkingPointsError && talkingPointsResult?.empty_state && (
              <div className="text-center py-3">
                <p className="text-sm text-slate-500">{talkingPointsResult.message || 'Add notes or LinkedIn to get personalized points'}</p>
              </div>
            )}

            {/* Talking Points Result */}
            {!talkingPointsLoading && !talkingPointsError && talkingPointsResult?.output && (
              <div className="space-y-2.5">
                {/* Opener */}
                <div className="bg-white rounded-lg p-3 border border-orange-100">
                  <div className="text-[10px] font-semibold text-orange-700 uppercase tracking-wide mb-1">Opener</div>
                  <p className="text-sm text-slate-800">{talkingPointsResult.output.personalized_opener}</p>
                </div>

                {/* Points */}
                {talkingPointsResult.output.talking_points.map((point, index) => (
                  <div key={index} className="bg-white rounded-lg p-3 border border-orange-100">
                    <p className="text-sm text-slate-700">{point.text}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {point.source_labels.map((label) => (
                        <SourceChip key={label} label={label} />
                      ))}
                    </div>
                  </div>
                ))}

                {/* Follow-ups */}
                {talkingPointsResult.output.follow_up_questions.length > 0 && (
                  <div>
                    <div className="text-[10px] font-semibold text-orange-700 uppercase tracking-wide mb-1.5">Ask</div>
                    {talkingPointsResult.output.follow_up_questions.map((q, index) => (
                      <div key={index} className="bg-white rounded-lg p-2.5 border border-orange-100 mb-1.5">
                        <p className="text-sm text-slate-700">{q.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Watchouts */}
                {talkingPointsResult.output.watchouts.length > 0 && (
                  <div className="space-y-1.5">
                    {talkingPointsResult.output.watchouts.map((item, index) => (
                      <div key={index} className="flex items-start gap-2 bg-amber-50 rounded-lg p-2.5 border border-amber-200">
                        <AlertTriangle size={13} className="text-amber-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-amber-800">{item}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION 3: Contact Info */}
          {(contact.email || contact.phone || contact.linkedin_url) && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 mb-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Contact Info</h3>
              <div className="space-y-2.5">
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-3 text-slate-700">
                    <Mail size={18} className="text-orange-500" />
                    <span className="text-sm">{contact.email}</span>
                  </a>
                )}
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} className="flex items-center gap-3 text-slate-700">
                    <Phone size={18} className="text-orange-500" />
                    <span className="text-sm">{contact.phone}</span>
                  </a>
                )}
                {contact.linkedin_url && (
                  <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-slate-700">
                    <Linkedin size={18} className="text-orange-500" />
                    <span className="text-sm">LinkedIn Profile</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions Row */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSendEmail(); }}
              disabled={!contact.email}
              className="flex-1 flex flex-col items-center gap-1 py-3 bg-white rounded-xl border border-slate-200 shadow-sm disabled:opacity-40"
            >
              <Send size={18} className="text-blue-500" />
              <span className="text-[10px] font-medium text-slate-600">Email</span>
            </button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleViewLinkedIn(); }}
              disabled={!contact.linkedin_url}
              className="flex-1 flex flex-col items-center gap-1 py-3 bg-white rounded-xl border border-slate-200 shadow-sm disabled:opacity-40"
            >
              <ExternalLink size={18} className="text-sky-500" />
              <span className="text-[10px] font-medium text-slate-600">LinkedIn</span>
            </button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleScheduleMeeting(); }}
              className="flex-1 flex flex-col items-center gap-1 py-3 bg-white rounded-xl border border-slate-200 shadow-sm"
            >
              <CalendarPlus size={18} className="text-green-500" />
              <span className="text-[10px] font-medium text-slate-600">Meet</span>
            </button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAddReminder(contactId); }}
              className="flex-1 flex flex-col items-center gap-1 py-3 bg-white rounded-xl border border-slate-200 shadow-sm"
            >
              <Clock size={18} className="text-orange-500" />
              <span className="text-[10px] font-medium text-slate-600">Remind</span>
            </button>
          </div>

          {/* Expandable Details */}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAllDetails(!showAllDetails); }}
            className="w-full flex items-center justify-between bg-white rounded-xl p-3 shadow-sm border border-slate-200 mb-4"
          >
            <span className="text-sm font-medium text-slate-700">More Details & History</span>
            <ChevronDown size={18} className={`text-slate-400 transition-transform ${showAllDetails ? 'rotate-180' : ''}`} />
          </button>

          {showAllDetails && (
            <>
              {/* Where/when met */}
              {(contact.met_at || contact.met_date) && (
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 mb-4 space-y-2.5">
                  {contact.met_at && (
                    <div className="flex items-center gap-3">
                      <MapPin size={18} className="text-orange-500" />
                      <div>
                        <div className="text-xs text-slate-500">Where we met</div>
                        <div className="text-sm text-slate-900 font-medium capitalize">{contact.met_at}</div>
                      </div>
                    </div>
                  )}
                  {contact.met_date && (
                    <div className="flex items-center gap-3">
                      <Calendar size={18} className="text-orange-500" />
                      <div>
                        <div className="text-xs text-slate-500">Date met</div>
                        <div className="text-sm text-slate-900 font-medium">{formatDate(contact.met_date)}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tags */}
              {contact.tags && Array.isArray(contact.tags) && contact.tags.length > 0 && (
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag size={16} className="text-orange-500" />
                    <h3 className="text-sm font-semibold text-slate-700">Tags</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {contact.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Interaction History */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-orange-500" />
                    <h3 className="text-sm font-semibold text-slate-700">Interaction History</h3>
                  </div>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAddInteraction(!showAddInteraction); }}
                    className="text-orange-600 active:text-orange-800"
                  >
                    <Plus size={18} />
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
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); addInteractionNote(); }}
                      disabled={!newInteraction.trim()}
                      className="w-full bg-orange-500 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50 active:scale-[0.98] transition-transform"
                    >
                      Add Note
                    </button>
                  </div>
                )}

                {Array.isArray(interactionHistory) && interactionHistory.length > 0 ? (
                  <div className="space-y-2">
                    {[...interactionHistory].reverse().map((interaction: any, index) => (
                      <div key={index} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <div className="text-xs text-slate-500 mb-1">{formatDateTime(interaction.date)}</div>
                        <div className="text-sm text-slate-700">{interaction.note}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 text-center py-3">No interactions recorded yet</p>
                )}
              </div>

              {/* CRM Export & Save */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 mb-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Export</h3>
                <div className="space-y-2">
                  <div className="relative">
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowCRMExport(!showCRMExport); }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 active:scale-[0.98] transition-all"
                    >
                      <Download size={18} className="text-slate-600" />
                      <span className="text-sm font-medium text-slate-700">Export to CRM</span>
                      <ChevronDown size={16} className={`ml-auto text-slate-400 transition-transform ${showCRMExport ? 'rotate-180' : ''}`} />
                    </button>

                    {showCRMExport && (
                      <div className="mt-2 space-y-2 pl-4">
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleExportHubSpot(); }}
                          className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 text-sm active:scale-[0.98]"
                        >
                          <Download size={16} />
                          <span>HubSpot CSV</span>
                        </button>
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleExportSalesforce(); }}
                          className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm active:scale-[0.98]"
                        >
                          <Download size={16} />
                          <span>Salesforce CSV</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSaveAsContact(); }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 active:scale-[0.98] transition-all"
                  >
                    <User size={18} className="text-slate-600" />
                    <span className="text-sm font-medium text-slate-700">Download vCard</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Floating Action Button - Quick Capture */}
      {onQuickCapture && (
        <div className="absolute bottom-6 right-5 z-10">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickCapture();
            }}
            className="w-14 h-14 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full shadow-lg shadow-orange-500/30 flex items-center justify-center active:scale-90 transition-transform"
          >
            <Plus size={28} className="text-white" />
          </button>
        </div>
      )}
    </div>
  );
}
