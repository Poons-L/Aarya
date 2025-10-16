import { useState } from 'react';
import { X, Users, Calendar, MapPin, FileText, Plus, Minus } from 'lucide-react';
import { Session } from '../hooks/useEvents';

interface Plan1On1MeetingModalProps {
  session: Session;
  onClose: () => void;
  onSave: (meeting: {
    title: string;
    attendees: string[];
    start_time: string;
    end_time: string;
    location: string;
    notes: string;
    session_id: string;
  }, addToCalendar: boolean) => void;
}

export function Plan1On1MeetingModal({ session, onClose, onSave }: Plan1On1MeetingModalProps) {
  const sessionStart = new Date(session.start_time);
  const defaultStart = new Date(sessionStart.getTime() + 60 * 60 * 1000);
  const defaultEnd = new Date(defaultStart.getTime() + 15 * 60 * 1000);

  const [title, setTitle] = useState(`1-1 during ${session.title}`);
  const [attendees, setAttendees] = useState<string[]>(['']);
  const [startTime, setStartTime] = useState(defaultStart.toISOString().slice(0, 16));
  const [endTime, setEndTime] = useState(defaultEnd.toISOString().slice(0, 16));
  const [location, setLocation] = useState(session.room || session.location || '');
  const [notes, setNotes] = useState('');
  const [addToCalendar, setAddToCalendar] = useState(false);

  const handleAddAttendee = () => {
    setAttendees([...attendees, '']);
  };

  const handleRemoveAttendee = (index: number) => {
    setAttendees(attendees.filter((_, i) => i !== index));
  };

  const handleAttendeeChange = (index: number, value: string) => {
    const newAttendees = [...attendees];
    newAttendees[index] = value;
    setAttendees(newAttendees);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const filteredAttendees = attendees.filter(a => a.trim() !== '');

    if (!title.trim()) {
      alert('Please enter a meeting title');
      return;
    }

    if (filteredAttendees.length === 0) {
      alert('Please add at least one attendee');
      return;
    }

    if (new Date(startTime) >= new Date(endTime)) {
      alert('End time must be after start time');
      return;
    }

    onSave(
      {
        title: title.trim(),
        attendees: filteredAttendees,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        location: location.trim(),
        notes: notes.trim(),
        session_id: session.id,
      },
      addToCalendar
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Plan 1-1 Meeting</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="text-sm font-semibold text-orange-900 mb-1">Related Session</div>
            <div className="text-sm text-orange-700">{session.title}</div>
            {session.speaker && (
              <div className="text-xs text-orange-600 mt-1">Speaker: {session.speaker}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <FileText size={16} className="inline mr-1" />
              Meeting Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
              placeholder="Enter meeting title"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <Users size={16} className="inline mr-1" />
              Attendees
            </label>
            <div className="space-y-2">
              {attendees.map((attendee, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={attendee}
                    onChange={(e) => handleAttendeeChange(index, e.target.value)}
                    className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                    placeholder="Name or email"
                  />
                  {attendees.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAttendee(index)}
                      className="px-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Minus size={20} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddAttendee}
                className="flex items-center gap-2 text-orange-600 font-medium text-sm hover:text-orange-700 transition-colors"
              >
                <Plus size={16} />
                Add Attendee
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <Calendar size={16} className="inline mr-1" />
                Start Time
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                End Time
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <MapPin size={16} className="inline mr-1" />
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
              placeholder="Meeting location"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <FileText size={16} className="inline mr-1" />
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors resize-none"
              placeholder="Meeting notes or agenda"
            />
          </div>

          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
            <input
              type="checkbox"
              id="addToCalendar"
              checked={addToCalendar}
              onChange={(e) => setAddToCalendar(e.target.checked)}
              className="w-5 h-5 text-orange-600 border-slate-300 rounded focus:ring-orange-500"
            />
            <label htmlFor="addToCalendar" className="text-sm text-slate-700">
              Also add to my calendar after saving
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Save Meeting
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
