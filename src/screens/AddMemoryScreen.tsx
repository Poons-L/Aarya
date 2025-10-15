import { useState } from 'react';
import { ArrowLeft, Mic, FileText, Camera, Loader, Brain, Tag, User } from 'lucide-react';
import { useMemories } from '../hooks/useMemories';
import { Contact } from '../hooks/useContacts';

interface AddMemoryScreenProps {
  onBack: () => void;
  onSave: () => void;
  contacts?: Contact[];
}

type CaptureMode = 'select' | 'voice' | 'text' | 'ocr';

export function AddMemoryScreen({ onBack, onSave, contacts = [] }: AddMemoryScreenProps) {
  const { addMemory, transcribeAudio, summarizeText } = useMemories();
  const [mode, setMode] = useState<CaptureMode>('select');
  const [isRecording, setIsRecording] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);

  const handleVoiceCapture = async () => {
    setError(null);
    setLoading(true);

    try {
      const mockTranscript = "Discussed project timeline with Sarah. She mentioned Q2 delivery targets and needs technical specs by end of month. Follow up next week about resource allocation.";
      setText(mockTranscript);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to transcribe audio');
      setLoading(false);
    }
  };

  const handleTextSubmit = async () => {
    if (!text.trim()) {
      setError('Please enter some text');
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
        linked_contact_id: selectedContact || undefined,
      });

      if (addError) throw new Error(addError);

      onSave();
    } catch (err: any) {
      setError(err.message || 'Failed to save memory');
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'select') {
    return (
      <div className="h-full bg-white flex flex-col">
        <div className="px-6 py-4 flex items-center border-b border-slate-200">
          <button onClick={onBack} className="p-2 -ml-2 active:bg-slate-100 rounded-full transition-colors" aria-label="Go back">
            <ArrowLeft size={24} className="text-slate-700" />
          </button>
          <h1 className="text-xl font-bold text-slate-900 ml-4">Capture Memory</h1>
        </div>

        <div className="flex-1 px-6 py-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">How would you like to capture this?</h2>
          <p className="text-slate-600 mb-8">Choose your preferred input method</p>

          <div className="space-y-4">
            <button
              onClick={() => {
                setMode('voice');
                handleVoiceCapture();
              }}
              className="w-full bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-2xl p-6 shadow-lg active:scale-95 transition-transform text-left"
            >
              <Mic size={32} className="mb-3" />
              <div className="font-bold text-lg mb-1">Voice Recording</div>
              <div className="text-orange-100 text-sm">Record a conversation or quick note</div>
            </button>

            <button
              onClick={() => setMode('text')}
              className="w-full bg-white border-2 border-slate-200 rounded-2xl p-6 active:bg-slate-50 transition-colors text-left"
            >
              <FileText size={32} className="text-slate-700 mb-3" />
              <div className="font-bold text-lg mb-1 text-slate-900">Type Note</div>
              <div className="text-slate-600 text-sm">Write out your thoughts manually</div>
            </button>

            <button
              onClick={() => setMode('ocr')}
              className="w-full bg-white border-2 border-slate-200 rounded-2xl p-6 active:bg-slate-50 transition-colors text-left"
            >
              <Camera size={32} className="text-slate-700 mb-3" />
              <div className="font-bold text-lg mb-1 text-slate-900">Capture Photo</div>
              <div className="text-slate-600 text-sm">Scan business card or document</div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center">
          <button onClick={() => mode === 'text' || mode === 'ocr' ? setMode('select') : onBack()} className="p-2 -ml-2 active:bg-slate-100 rounded-full transition-colors" aria-label="Go back">
            <ArrowLeft size={24} className="text-slate-700" />
          </button>
          <h1 className="text-xl font-bold text-slate-900 ml-4">
            {mode === 'voice' ? 'Voice Memory' : mode === 'ocr' ? 'Photo Capture' : 'Text Memory'}
          </h1>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleTextSubmit(); }} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && mode === 'voice' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader className="animate-spin text-orange-500 mb-4" size={48} />
            <p className="text-slate-600 font-medium">Transcribing audio...</p>
            <p className="text-sm text-slate-500 mt-2">This may take a few moments</p>
          </div>
        )}

        {!loading && mode === 'voice' && text && (
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center">
                <Mic size={20} className="text-white" />
              </div>
              <div>
                <div className="font-bold text-slate-900">Transcription Complete</div>
                <div className="text-sm text-slate-600">Review and save below</div>
              </div>
            </div>
          </div>
        )}

        {(mode === 'text' || (mode === 'voice' && text && !loading)) && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Memory Content *
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type or paste your note here..."
                rows={8}
                disabled={loading}
                className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors resize-none disabled:bg-slate-50"
                required
              />
              <p className="text-xs text-slate-500 mt-1.5">AI will automatically summarize and tag this</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Link to Person (Optional)
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {contacts.length > 0 ? (
                  contacts.slice(0, 5).map(contact => (
                    <button
                      key={contact.id}
                      type="button"
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
                    </button>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-500 text-sm">
                    No contacts yet
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {mode === 'ocr' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Camera size={64} className="text-slate-300 mb-4" />
            <p className="text-slate-600 font-medium mb-2">OCR coming soon</p>
            <p className="text-sm text-slate-500 text-center max-w-xs">
              Business card scanning will be available in the next update
            </p>
          </div>
        )}
      </form>

      {mode !== 'ocr' && text && !loading && (
        <div className="px-6 py-4 bg-white border-t border-slate-200">
          <button
            type="button"
            onClick={handleTextSubmit}
            disabled={loading || !text.trim()}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="animate-spin" size={20} />
                Processing...
              </>
            ) : (
              <>
                <Brain size={20} />
                Save Memory
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
