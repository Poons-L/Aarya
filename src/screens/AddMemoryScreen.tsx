import { useState, useRef } from 'react';
import { ArrowLeft, Mic, FileText, Camera, Loader, Brain, Tag, User, Upload, X, Home, Calendar } from 'lucide-react';
import { useMemories } from '../hooks/useMemories';
import { Contact, useContacts } from '../hooks/useContacts';
import { ContactSuggestion } from '../components/ContactSuggestion';
import { parseBusinessCard } from '../utils/ocr';
import { QuickReminderChips } from '../components/QuickReminderChips';

interface AddMemoryScreenProps {
  onBack: () => void;
  onSave: () => void;
  onHome: () => void;
  contacts?: Contact[];
}

interface DetectedContact {
  name?: string;
  title?: string;
  company?: string;
  email?: string;
  phone?: string;
}

type CaptureMode = 'select' | 'voice' | 'text' | 'ocr';

export function AddMemoryScreen({ onBack, onSave, onHome, contacts = [] }: AddMemoryScreenProps) {
  const { addMemory, transcribeAudio, summarizeText } = useMemories();
  const { addContact } = useContacts();
  const [mode, setMode] = useState<CaptureMode>('select');
  const [isRecording, setIsRecording] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [detectedContact, setDetectedContact] = useState<DetectedContact | null>(null);
  const [showContactSuggestion, setShowContactSuggestion] = useState(false);
  const [showReminderChips, setShowReminderChips] = useState(false);
  const [memoryDate, setMemoryDate] = useState(new Date().toISOString().split('T')[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCapturedImage(reader.result as string);
      performOCR(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const performOCR = async (imageData: string) => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-ocr`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageData }),
        }
      );

      if (!response.ok) {
        throw new Error('OCR processing failed');
      }

      const result = await response.json();
      const extractedText = result.text || '';
      setText(extractedText);

      const contactInfo = parseBusinessCard(extractedText);
      if (contactInfo && (contactInfo.name || contactInfo.email)) {
        setDetectedContact(contactInfo);
        setShowContactSuggestion(true);
      }

      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to process image');
      setLoading(false);
    }
  };

  const handleAcceptContact = async (contactInfo: DetectedContact) => {
    try {
      const { data } = await addContact({
        name: contactInfo.name || 'Unknown',
        company: contactInfo.company,
        title: contactInfo.title,
        email: contactInfo.email,
        phone: contactInfo.phone,
      });

      if (data) {
        setSelectedContact(data.id);
      }
      setShowContactSuggestion(false);
    } catch (err: any) {
      console.error('Failed to create contact:', err);
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
        source_type: mode === 'voice' ? 'voice' : mode === 'ocr' ? 'ocr' : 'text',
        linked_contact_id: selectedContact || undefined,
        memory_date: new Date(memoryDate).toISOString(),
      });

      if (addError) throw new Error(addError);

      setShowReminderChips(true);
    } catch (err: any) {
      setError(err.message || 'Failed to save memory');
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'select') {
    return (
      <div className="h-full bg-white flex flex-col">
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-full transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={20} className="text-slate-700" />
            <span className="font-medium text-slate-700">Back</span>
          </button>
          <h1 className="text-xl font-bold text-slate-900">Capture Memory</h1>
          <div className="w-20"></div>
        </div>

        <div className="flex-1 px-6 py-12 overflow-y-auto">
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

        <div className="px-6 py-4 bg-white border-t border-slate-200">
          <button
            onClick={onHome}
            className="w-full flex items-center justify-center gap-2 py-4 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl font-semibold text-slate-700 transition-colors"
          >
            <Home size={20} />
            <span>Go to Home</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200">
        <button
          onClick={() => setMode('select')}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-full transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={20} className="text-slate-700" />
          <span className="font-medium text-slate-700">Back</span>
        </button>
        <h1 className="text-xl font-bold text-slate-900">
          {mode === 'voice' ? 'Voice Memory' : mode === 'ocr' ? 'Photo Capture' : 'Text Memory'}
        </h1>
        <div className="w-20"></div>
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
                <Calendar size={16} className="inline mr-1.5" />
                Memory Date
              </label>
              <input
                type="date"
                value={memoryDate}
                onChange={(e) => setMemoryDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                disabled={loading}
                className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors disabled:bg-slate-50"
              />
              <p className="text-xs text-slate-500 mt-1.5">When did this memory occur?</p>
            </div>

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

            {showReminderChips && (
              <QuickReminderChips
                memoryText={text}
                contactId={selectedContact || undefined}
                onReminderCreated={onSave}
              />
            )}
          </>
        )}

        {mode === 'ocr' && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageCapture}
              className="hidden"
            />

            {!capturedImage && !loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-32 h-32 bg-gradient-to-br from-orange-100 to-amber-100 rounded-3xl flex items-center justify-center mb-6">
                  <Camera size={64} className="text-orange-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Capture or Upload Photo</h3>
                <p className="text-sm text-slate-500 text-center max-w-xs mb-6">
                  Take a photo of a business card, document, or note
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-3 px-8 rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center gap-2"
                >
                  <Upload size={20} />
                  Choose Photo
                </button>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader className="animate-spin text-orange-500 mb-4" size={48} />
                <p className="text-slate-600 font-medium">Processing image...</p>
                <p className="text-sm text-slate-500 mt-2">Extracting text from photo</p>
              </div>
            )}

            {capturedImage && !loading && (
              <div>
                <div className="relative mb-4 rounded-2xl overflow-hidden border-2 border-slate-200">
                  <img src={capturedImage} alt="Captured" className="w-full" />
                  <button
                    type="button"
                    onClick={() => {
                      setCapturedImage(null);
                      setText('');
                    }}
                    className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full shadow-lg active:scale-95 transition-transform"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Camera size={20} className="text-green-600" />
                    <span className="font-bold text-green-900">Text Extracted</span>
                  </div>
                  <p className="text-sm text-green-800">Review and edit the extracted text below</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Extracted Text *
                  </label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Extracted text will appear here..."
                    rows={6}
                    className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors resize-none"
                    required
                  />
                </div>

                {showContactSuggestion && detectedContact && (
                  <ContactSuggestion
                    contactInfo={detectedContact}
                    onAccept={handleAcceptContact}
                    onReject={() => setShowContactSuggestion(false)}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </form>

      {text && !loading && (
        <div className="px-6 py-4 bg-white border-t border-slate-200 space-y-3">
          {showReminderChips ? (
            <button
              type="button"
              onClick={onSave}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Done
            </button>
          ) : (
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
          )}
          <button
            type="button"
            onClick={onHome}
            className="w-full flex items-center justify-center gap-2 py-4 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl font-semibold text-slate-700 transition-colors"
          >
            <Home size={20} />
            <span>Go to Home</span>
          </button>
        </div>
      )}
    </div>
  );
}
