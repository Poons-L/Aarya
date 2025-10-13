import { useState, useEffect } from 'react';
import { ArrowLeft, Mic, Square, Play, Pause } from 'lucide-react';

interface RecordConversationScreenProps {
  onBack: () => void;
  onSave: () => void;
}

export function RecordConversationScreen({ onBack, onSave }: RecordConversationScreenProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState('');

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

  const handleToggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      setRecordingTime(0);
      setTranscript('');
    } else {
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  return (
    <div className="h-full bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col text-white">
      <div className="px-6 py-4 flex items-center justify-between">
        <button onClick={onBack} className="p-2 -ml-2 active:bg-white/10 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-white" />
        </button>
        <h1 className="text-lg font-semibold">Record Conversation</h1>
        {isRecording && (
          <button
            onClick={onSave}
            className="text-amber-400 font-semibold px-4 py-2 active:bg-white/10 rounded-lg transition-colors"
          >
            Save
          </button>
        )}
        {!isRecording && <div className="w-16"></div>}
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
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-95 transition-transform"
          >
            {isPaused ? <Play size={28} /> : <Pause size={28} />}
          </button>
        )}

        <button
          onClick={handleToggleRecording}
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
