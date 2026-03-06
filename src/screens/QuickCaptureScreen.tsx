import { useState } from 'react';
import { ArrowLeft, Camera, Mic, StopCircle } from 'lucide-react';
import { useContacts } from '../hooks/useContacts';

interface QuickCaptureScreenProps {
  onBack: () => void;
  onSave: () => void;
}

export function QuickCaptureScreen({ onBack, onSave }: QuickCaptureScreenProps) {
  const { addContact } = useContacts();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const [note, setNote] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setTimeout(() => {
        setIsRecording(false);
        setNote('Voice note recorded (transcription would appear here in production)');
      }, 3000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await addContact({
        name: name.trim(),
        photo_url: photoPreview,
        notes: note,
        met_date: new Date().toISOString().split('T')[0],
      });
      onSave();
    } catch (error) {
      console.error('Error saving contact:', error);
      alert('Failed to save contact. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <button onClick={onBack} className="text-slate-600 active:text-slate-900">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-semibold text-slate-900">Quick Capture</h1>
        <div className="w-6" />
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-8">
        <div className="space-y-8">
          <div className="text-center">
            <p className="text-sm text-slate-600 mb-6">
              Quickly add a contact with just the essentials. Perfect for events and networking!
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="relative mb-2">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-5xl font-semibold overflow-hidden">
                {photoPreview ? (
                  <img src={photoPreview} alt="Contact" className="w-full h-full object-cover" />
                ) : (
                  name[0]?.toUpperCase() || '?'
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-orange-500 text-white p-3 rounded-full shadow-lg cursor-pointer active:scale-95 transition-transform">
                <Camera size={24} />
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-slate-500 mt-2">Tap to add photo</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name..."
              autoFocus
              className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            />
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Quick Note
            </label>
            <div className="space-y-3">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Type a quick note or use voice..."
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
              />
              <button
                type="button"
                onClick={toggleRecording}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
                  isRecording
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-gradient-to-r from-orange-500 to-pink-500 text-white'
                } active:scale-98`}
              >
                {isRecording ? (
                  <>
                    <StopCircle size={20} />
                    Recording...
                  </>
                ) : (
                  <>
                    <Mic size={20} />
                    Record Voice Note
                  </>
                )}
              </button>
              {isRecording && (
                <p className="text-xs text-slate-500 text-center">
                  Speak clearly. Tap Stop when finished.
                </p>
              )}
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <p className="text-sm text-orange-800">
              <span className="font-semibold">Tip:</span> You can add more details later from the contact's profile.
            </p>
          </div>
        </div>
      </form>

      <div className="px-6 py-4 bg-white border-t border-slate-200">
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={loading || !name.trim() || isRecording}
          className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-4 rounded-xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-98 transition-transform"
        >
          {loading ? 'Saving...' : 'Save Contact'}
        </button>
      </div>
    </div>
  );
}
