import { useState } from 'react';
import { ArrowLeft, Mic, FileText, Loader, Save, AlertCircle } from 'lucide-react';
import { Session } from '../hooks/useEvents';
import { useMemories } from '../hooks/useMemories';

interface SessionNotesScreenProps {
  session: Session;
  eventId: string;
  onBack: () => void;
  onSave: () => void;
}

export function SessionNotesScreen({ session, eventId, onBack, onSave }: SessionNotesScreenProps) {
  const { addMemory, transcribeAudio, summarizeText } = useMemories();
  const [mode, setMode] = useState<'select' | 'voice' | 'text'>('select');
  const [isRecording, setIsRecording] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVoiceCapture = async () => {
    setError(null);
    setLoading(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const transcription = await transcribeAudio(audioBlob);

        if (transcription) {
          setText(transcription);
          setMode('text');
        }

        stream.getTracks().forEach(track => track.stop());
        setLoading(false);
      };

      mediaRecorder.start();
      setIsRecording(true);

      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          setIsRecording(false);
        }
      }, 30000);
    } catch (err: any) {
      setError(err.message || 'Failed to record audio. Please check microphone permissions.');
      setLoading(false);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  const handleSave = async () => {
    if (!text.trim()) {
      setError('Please add some content before saving');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const summary = await summarizeText(text, 'summary');
      const tags = await summarizeText(text, 'tags');

      const { error: addError } = await addMemory({
        text,
        summary,
        tags: Array.isArray(tags) ? tags : [],
        source_type: mode === 'voice' ? 'voice' : 'text',
        event_id: eventId,
        session_id: session.id,
      });

      if (addError) throw new Error(addError);

      onSave();
    } catch (err: any) {
      setError(err.message || 'Failed to save notes');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200">
        <button
          onClick={onBack}
          disabled={loading}
          className="text-slate-600 active:text-slate-900 transition-colors disabled:opacity-50"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-slate-900">Session Notes</h1>
        <div className="w-6" />
      </div>

      <div className="px-6 py-4 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
        <h2 className="font-bold text-slate-900 mb-1">{session.title}</h2>
        <p className="text-sm text-slate-600">
          {formatTime(session.start_time)} - {formatTime(session.end_time)}
        </p>
        {session.speaker && (
          <p className="text-sm text-slate-600 mt-1">Speaker: {session.speaker}</p>
        )}
      </div>

      {mode === 'select' ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Capture Your Notes</h2>
            <p className="text-sm text-slate-600">
              Choose how you'd like to record notes from this session
            </p>
          </div>

          <div className="w-full max-w-sm space-y-4">
            <button
              onClick={() => {
                setMode('voice');
                handleVoiceCapture();
              }}
              disabled={loading}
              className="w-full flex items-center gap-4 p-6 bg-gradient-to-r from-orange-500 to-amber-400 text-white rounded-2xl shadow-lg active:scale-95 transition-transform disabled:opacity-50"
            >
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                <Mic size={28} />
              </div>
              <div className="flex-1 text-left">
                <div className="font-bold text-lg">Voice Recording</div>
                <div className="text-sm text-white/90">Record up to 30 seconds</div>
              </div>
            </button>

            <button
              onClick={() => setMode('text')}
              disabled={loading}
              className="w-full flex items-center gap-4 p-6 bg-white border-2 border-slate-200 rounded-2xl active:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center">
                <FileText size={28} className="text-orange-600" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-bold text-lg text-slate-900">Type Notes</div>
                <div className="text-sm text-slate-600">Write your observations</div>
              </div>
            </button>
          </div>
        </div>
      ) : mode === 'voice' ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          {loading ? (
            <>
              <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-amber-400 rounded-full flex items-center justify-center mb-6 animate-pulse">
                {isRecording ? (
                  <Mic size={40} className="text-white" />
                ) : (
                  <Loader size={40} className="text-white animate-spin" />
                )}
              </div>
              <p className="text-lg font-semibold text-slate-900 mb-2">
                {isRecording ? 'Recording...' : 'Processing audio...'}
              </p>
              <p className="text-sm text-slate-600 text-center max-w-xs">
                {isRecording ? 'Speak clearly about the session' : 'Converting speech to text'}
              </p>
              {isRecording && (
                <button
                  onClick={stopRecording}
                  className="mt-8 px-8 py-3 bg-red-500 text-white rounded-xl font-semibold active:bg-red-600 transition-colors"
                >
                  Stop Recording
                </button>
              )}
            </>
          ) : null}

          {error && (
            <div className="w-full max-w-md mt-6">
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center gap-3">
                <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
              <button
                onClick={() => setMode('select')}
                className="w-full mt-4 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold active:bg-slate-200 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col px-6 py-6">
          {error && (
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center gap-3 mb-4">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          <label className="block text-sm font-medium text-slate-700 mb-2">
            Session Notes
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What did you learn? Key takeaways? Action items?"
            rows={12}
            disabled={loading}
            className="flex-1 px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors resize-none disabled:bg-slate-50"
            autoFocus
          />
          <p className="text-xs text-slate-500 mt-2 mb-4">
            AI will automatically summarize and tag your notes
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setMode('select')}
              disabled={loading}
              className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold active:bg-slate-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading || !text.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-orange-500 to-amber-400 text-white rounded-xl font-semibold shadow-md active:scale-95 transition-transform disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Save Notes
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
