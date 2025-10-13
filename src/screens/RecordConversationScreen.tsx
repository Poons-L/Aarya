import { useState, useEffect } from 'react';
import { ArrowLeft, Mic, Square, Play, Pause, User, X, Check, Tag, UserPlus } from 'lucide-react';
import { Contact } from '../hooks/useContacts';

interface RecordConversationScreenProps {
  onBack: () => void;
  onSave: () => void;
  onCreateContact?: () => void;
  contacts?: Contact[];
}

export function RecordConversationScreen({ onBack, onSave, onCreateContact, contacts = [] }: RecordConversationScreenProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [tags, setTags] = useState('');

  const mockTranscript = "We discussed the upcoming product launch and potential partnership opportunities. John mentioned he's interested in integrating our API with their platform. Follow up next week to discuss technical requirements.";

  useEffect(() => {
    let interval: number;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
        if (recordingTime > 5 && !transcript) {
          setTranscript(mockTranscript);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused, recordingTime, transcript]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
    if (transcript) {
      setShowSummary(true);
    }
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    setTranscript('');
    setShowSummary(false);
  };

  const handleDiscard = () => {
    setTranscript('');
    setRecordingTime(0);
    setShowSummary(false);
    setSelectedContact(null);
    setTags('');
    onBack();
  };

  const handleCancelRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
    setTranscript('');
    setRecordingTime(0);
  };

  const handleSaveRecording = () => {
    onSave();
  };

  if (showSummary) {
    return (
      <div className="h-full bg-white flex flex-col">
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center">
            <button onClick={handleDiscard} className="p-2 -ml-2 active:bg-slate-100 rounded-full transition-colors">
              <ArrowLeft size={24} className="text-slate-700" />
            </button>
            <h1 className="text-xl font-bold text-slate-900 ml-4">Recording Summary</h1>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center">
                <Mic size={20} className="text-white" />
              </div>
              <div>
                <div className="font-bold text-slate-900">Recording Complete</div>
                <div className="text-sm text-slate-600">{formatTime(recordingTime)}</div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Transcript
            </label>
            <div className="bg-slate-50 rounded-xl p-4 border-2 border-slate-200">
              <p className="text-slate-700 text-sm leading-relaxed">{transcript}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Attach to Contact (Optional)
            </label>

            {onCreateContact && (
              <button
                onClick={onCreateContact}
                className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-orange-500 bg-orange-50 active:bg-orange-100 transition-colors mb-3"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-400 rounded-full flex items-center justify-center">
                  <UserPlus size={20} className="text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-bold text-orange-700">Create New Contact</div>
                  <div className="text-sm text-orange-600">Add this person to your contacts</div>
                </div>
              </button>
            )}

            {contacts.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {contacts.slice(0, 5).map(contact => (
                  <button
                    key={contact.id}
                    onClick={() => setSelectedContact(contact.id === selectedContact ? null : contact.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors ${
                      selectedContact === contact.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-slate-200 bg-white active:bg-slate-50'
                    }`}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-400 rounded-full flex items-center justify-center text-white font-bold">
                      {contact.name.charAt(0)}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-slate-900">{contact.name}</div>
                      {contact.company && (
                        <div className="text-sm text-slate-600">{contact.company}</div>
                      )}
                    </div>
                    {selectedContact === contact.id && (
                      <Check size={20} className="text-orange-600" />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 text-sm">
                No contacts yet. Create one above to attach this recording.
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tags (Optional)
            </label>
            <div className="relative">
              <Tag size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="product, partnership, technical"
                className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1.5">Separate tags with commas</p>
          </div>
        </div>

        <div className="px-6 py-4 bg-white border-t border-slate-200 flex gap-3">
          <button
            onClick={handleDiscard}
            className="flex-1 bg-slate-100 text-slate-700 font-semibold py-4 rounded-2xl active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <X size={20} />
            Discard
          </button>
          <button
            onClick={handleSaveRecording}
            className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <Check size={20} />
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col text-white">
      <div className="px-6 py-4 flex items-center justify-between">
        <button onClick={onBack} className="p-2 -ml-2 active:bg-white/10 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-white" />
        </button>
        <h1 className="text-lg font-semibold">Record Conversation</h1>
        <div className="w-16"></div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="relative mb-12">
          <div className={`w-48 h-48 rounded-full flex items-center justify-center transition-all ${
            isRecording && !isPaused
              ? 'bg-red-500/20 animate-pulse'
              : 'bg-white/10'
          }`}>
            <div className={`w-40 h-40 rounded-full flex items-center justify-center transition-all ${
              isRecording && !isPaused
                ? 'bg-red-500/30'
                : 'bg-white/5'
            }`}>
              <Mic size={64} className={isRecording && !isPaused ? 'text-red-400' : 'text-white/50'} />
            </div>
          </div>
          {isRecording && !isPaused && (
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold animate-pulse">
              Recording
            </div>
          )}
        </div>

        <div className="text-center mb-8">
          <div className="text-5xl font-bold mb-2">{formatTime(recordingTime)}</div>
          {isRecording && (
            <div className="text-slate-400 text-sm">
              {isPaused ? 'Paused' : 'Listening...'}
            </div>
          )}
          {!isRecording && recordingTime === 0 && (
            <div className="text-slate-400 text-sm">Tap the button to start</div>
          )}
        </div>

        {transcript && (
          <div className="w-full bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 max-h-48 overflow-y-auto">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <div className="text-sm font-semibold text-amber-400">Live Transcription</div>
            </div>
            <p className="text-white/90 text-sm leading-relaxed">{transcript}</p>
          </div>
        )}
      </div>

      <div className="px-6 pb-12 flex flex-col items-center gap-6">
        {isRecording && (
          <div className="flex items-center gap-4">
            <button
              onClick={handleCancelRecording}
              className="px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full text-white font-semibold active:scale-95 transition-transform flex items-center gap-2"
            >
              <X size={20} />
              Cancel
            </button>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-95 transition-transform"
            >
              {isPaused ? <Play size={28} /> : <Pause size={28} />}
            </button>
          </div>
        )}

        <button
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all ${
            isRecording
              ? 'bg-white'
              : 'bg-gradient-to-br from-red-500 to-red-600'
          }`}
        >
          {isRecording ? (
            <Square size={32} className="text-red-500" fill="currentColor" />
          ) : (
            <Mic size={36} className="text-white" />
          )}
        </button>

        {!isRecording && recordingTime === 0 && (
          <div className="text-center text-slate-400 text-sm max-w-xs">
            Tap to start recording. The app will automatically transcribe your conversation in real-time.
          </div>
        )}
      </div>
    </div>
  );
}
