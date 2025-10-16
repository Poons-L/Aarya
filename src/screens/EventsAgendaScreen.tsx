import { useState, useRef } from 'react';
import { ArrowLeft, Calendar, MapPin, Clock, Users, Upload, Home, FileText } from 'lucide-react';
import { useEvents } from '../hooks/useEvents';
import { useReminders } from '../hooks/useReminders';
import { addToNativeCalendar, copyEventDetails } from '../utils/calendar';
import { Plan1On1MeetingModal } from '../components/Plan1On1MeetingModal';

interface EventsAgendaScreenProps {
  onBack: () => void;
  onHome: () => void;
}

export function EventsAgendaScreen({ onBack, onHome }: EventsAgendaScreenProps) {
  const { events, sessions, meetings, sessionNotes, createMeeting, importFromCSV, getSessionsForEvent, getNotesForSession } = useEvents();
  const { addReminder } = useReminders();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'schedule' | 'meetings' | 'notes'>('schedule');
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const result = await importFromCSV(text);

      if (result.success) {
        showToastMessage(`Imported ${result.count} sessions successfully!`);
      } else {
        showToastMessage(`Import failed: ${result.error}`);
      }
    } catch (error) {
      showToastMessage('Failed to read CSV file');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAddToCalendar = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    const success = addToNativeCalendar({
      title: session.title,
      startTime: new Date(session.start_time),
      endTime: new Date(session.end_time),
      location: session.room || session.location || '',
      notes: `Added via Re.Me (session_id: ${session.id})${session.speaker ? `\nSpeaker: ${session.speaker}` : ''}`
    });

    if (success) {
      showToastMessage('Opening calendar...');
    } else {
      const details = copyEventDetails({
        title: session.title,
        startTime: new Date(session.start_time),
        endTime: new Date(session.end_time),
        location: session.room || session.location,
        notes: session.speaker ? `Speaker: ${session.speaker}` : undefined
      });

      navigator.clipboard.writeText(details);
      showToastMessage('Event details copied to clipboard');
    }
  };

  const handleScheduleFollowUp = async (sessionId: string, days: number) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    const dueDate = new Date(session.end_time);
    dueDate.setDate(dueDate.getDate() + days);

    const { error } = await addReminder({
      title: `Follow up: ${session.title}`,
      description: `Follow up on session "${session.title}"${session.speaker ? ` by ${session.speaker}` : ''}`,
      due_date: dueDate.toISOString(),
      priority: 'medium'
    });

    if (!error) {
      showToastMessage(`Follow-up reminder set for ${days} ${days === 1 ? 'day' : 'days'} after session`);
    } else {
      showToastMessage('Failed to create reminder');
    }
  };

  const handleSaveMeeting = async (meetingData: any, addToCalendar: boolean) => {
    const { error } = await createMeeting(meetingData);

    if (!error) {
      showToastMessage('Meeting saved successfully!');
      setShowMeetingModal(false);
      setSelectedSession(null);

      if (addToCalendar) {
        setTimeout(() => {
          addToNativeCalendar({
            title: meetingData.title,
            startTime: new Date(meetingData.start_time),
            endTime: new Date(meetingData.end_time),
            location: meetingData.location,
            notes: `Attendees: ${meetingData.attendees.join(', ')}\n\n${meetingData.notes || ''}`
          });
        }, 500);
      }
    } else {
      showToastMessage('Failed to save meeting');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const sessionToShow = selectedSession ? sessions.find(s => s.id === selectedSession) : null;
  const sessionNotesForSelected = selectedSession ? getNotesForSession(selectedSession) : [];

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
          <div className="text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-full">
            {events.length} {events.length === 1 ? 'Event' : 'Events'}
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-1">Events & Agenda</h1>
        <p className="text-sm text-slate-600 mb-4">
          Manage event schedules, sessions, and meetings
        </p>

        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleCSVImport}
            className="hidden"
            id="csv-upload"
          />
          <label
            htmlFor="csv-upload"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-orange-500 text-white rounded-xl font-medium cursor-pointer hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            <Upload size={16} />
            {importing ? 'Importing...' : 'Import CSV'}
          </label>
        </div>

        <div className="flex gap-2 mt-4 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${
              activeTab === 'schedule'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Schedule ({sessions.length})
          </button>
          <button
            onClick={() => setActiveTab('meetings')}
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${
              activeTab === 'meetings'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Meetings ({meetings.length})
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${
              activeTab === 'notes'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Notes ({sessionNotes.length})
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {activeTab === 'schedule' && (
          <div className="space-y-4">
            {events.length === 0 ? (
              <div className="text-center py-12">
                <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-600 font-medium mb-2">No events yet</p>
                <p className="text-sm text-slate-500">Import a CSV to get started</p>
              </div>
            ) : (
              events.map(event => {
                const eventSessions = getSessionsForEvent(event.id);
                return (
                  <div key={event.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-400 rounded-xl flex flex-col items-center justify-center text-white flex-shrink-0">
                        <div className="text-xs font-semibold uppercase">
                          {new Date(event.start_date).toLocaleDateString('en-US', { month: 'short' })}
                        </div>
                        <div className="text-2xl font-bold">
                          {new Date(event.start_date).getDate()}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 mb-1">{event.name}</h3>
                        <div className="flex items-center gap-1.5 text-sm text-slate-600 mb-1">
                          <Calendar size={14} />
                          <span>{formatDate(event.start_date)} - {formatDate(event.end_date)}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1.5 text-sm text-slate-600">
                            <MapPin size={14} />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {eventSessions.length > 0 && (
                      <div className="space-y-2 pt-3 border-t border-slate-200">
                        <div className="text-xs font-bold text-slate-500 uppercase">
                          Sessions ({eventSessions.length})
                        </div>
                        {eventSessions.slice(0, 3).map(session => (
                          <button
                            key={session.id}
                            onClick={() => setSelectedSession(session.id)}
                            className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
                          >
                            <div className="font-semibold text-slate-900 text-sm mb-1">{session.title}</div>
                            <div className="flex items-center gap-3 text-xs text-slate-600">
                              <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {formatTime(session.start_time)}
                              </span>
                              {session.room && (
                                <span className="flex items-center gap-1">
                                  <MapPin size={12} />
                                  {session.room}
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                        {eventSessions.length > 3 && (
                          <div className="text-xs text-slate-500 text-center pt-1">
                            +{eventSessions.length - 3} more sessions
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'meetings' && (
          <div className="space-y-3">
            {meetings.length === 0 ? (
              <div className="text-center py-12">
                <Users size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-600 font-medium mb-2">No meetings scheduled</p>
                <p className="text-sm text-slate-500">Plan 1-1 meetings from sessions</p>
              </div>
            ) : (
              meetings.map(meeting => (
                <div key={meeting.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                  <div className="font-semibold text-slate-900 mb-2">{meeting.title}</div>
                  <div className="text-sm text-slate-600 space-y-1">
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      {formatTime(meeting.start_time)} - {formatTime(meeting.end_time)}
                    </div>
                    {meeting.location && (
                      <div className="flex items-center gap-2">
                        <MapPin size={14} />
                        {meeting.location}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Users size={14} />
                      {meeting.attendees.join(', ')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-3">
            {sessionNotes.length === 0 ? (
              <div className="text-center py-12">
                <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-600 font-medium mb-2">No session notes yet</p>
                <p className="text-sm text-slate-500">Take notes during sessions</p>
              </div>
            ) : (
              sessionNotes.map(note => {
                const session = sessions.find(s => s.id === note.session_id);
                return (
                  <div key={note.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                    {session && (
                      <div className="text-xs font-semibold text-orange-600 mb-2">{session.title}</div>
                    )}
                    <div className="text-sm text-slate-900 mb-2">{note.raw_text.substring(0, 150)}{note.raw_text.length > 150 ? '...' : ''}</div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="bg-slate-100 px-2 py-1 rounded">{note.source}</span>
                      <span>{formatDate(note.created_at)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {selectedSession && sessionToShow && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-t-3xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4">
              <button
                onClick={() => setSelectedSession(null)}
                className="text-slate-400 hover:text-slate-600 mb-3"
              >
                ✕ Close
              </button>
              <h2 className="text-xl font-bold text-slate-900">{sessionToShow.title}</h2>
              {sessionToShow.speaker && (
                <p className="text-sm text-slate-600 mt-1">Speaker: {sessionToShow.speaker}</p>
              )}
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-700">
                  <Clock size={16} />
                  {formatTime(sessionToShow.start_time)} - {formatTime(sessionToShow.end_time)}
                </div>
                {sessionToShow.room && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <MapPin size={16} />
                    {sessionToShow.room}
                  </div>
                )}
                {sessionToShow.tags && sessionToShow.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {sessionToShow.tags.map((tag, i) => (
                      <span key={i} className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => handleAddToCalendar(sessionToShow.id)}
                  className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Calendar size={18} />
                  Add to Calendar
                </button>

                <button
                  onClick={() => setShowMeetingModal(true)}
                  className="w-full py-3 bg-slate-100 text-slate-900 rounded-xl font-semibold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Users size={18} />
                  Plan 1-1 Meeting
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleScheduleFollowUp(sessionToShow.id, 1)}
                    className="flex-1 py-3 bg-slate-100 text-slate-900 rounded-xl font-medium text-sm hover:bg-slate-200 transition-colors"
                  >
                    Follow-up (1d)
                  </button>
                  <button
                    onClick={() => handleScheduleFollowUp(sessionToShow.id, 3)}
                    className="flex-1 py-3 bg-slate-100 text-slate-900 rounded-xl font-medium text-sm hover:bg-slate-200 transition-colors"
                  >
                    Follow-up (3d)
                  </button>
                  <button
                    onClick={() => handleScheduleFollowUp(sessionToShow.id, 7)}
                    className="flex-1 py-3 bg-slate-100 text-slate-900 rounded-xl font-medium text-sm hover:bg-slate-200 transition-colors"
                  >
                    Follow-up (7d)
                  </button>
                </div>
              </div>

              {sessionNotesForSelected.length > 0 && (
                <div className="pt-4 border-t border-slate-200">
                  <h3 className="text-sm font-bold text-slate-700 mb-3">Notes ({sessionNotesForSelected.length})</h3>
                  <div className="space-y-2">
                    {sessionNotesForSelected.map(note => (
                      <div key={note.id} className="bg-slate-50 rounded-lg p-3">
                        <p className="text-sm text-slate-900">{note.raw_text}</p>
                        <p className="text-xs text-slate-500 mt-2">{formatDate(note.created_at)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showMeetingModal && sessionToShow && (
        <Plan1On1MeetingModal
          session={sessionToShow}
          onClose={() => {
            setShowMeetingModal(false);
          }}
          onSave={handleSaveMeeting}
        />
      )}

      {showToast && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 px-6 py-3 bg-slate-900 text-white rounded-xl shadow-lg max-w-sm text-center text-sm font-medium animate-fade-in z-50">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
