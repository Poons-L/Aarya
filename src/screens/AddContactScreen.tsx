import { useState } from 'react';
import { ArrowLeft, Camera, User, Building2, Mail, Phone, MapPin, Tag, AlertCircle, Smartphone } from 'lucide-react';
import { useContacts } from '../hooks/useContacts';
import { FollowUpModal } from '../components/FollowUpModal';

interface AddContactScreenProps {
  onBack: () => void;
  onSave: () => void;
}

export function AddContactScreen({ onBack, onSave }: AddContactScreenProps) {
  const { addContact, uploadPhoto } = useContacts();
  const [captureMethod, setCaptureMethod] = useState<'photo' | 'manual' | 'card' | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [savedContactName, setSavedContactName] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    title: '',
    email: '',
    phone: '',
    metAt: '',
    tags: '',
    conversation: '',
    notes: ''
  });

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setCaptureMethod('manual');
    }
  };

  const handlePickFromPhone = async () => {
    try {
      if ('contacts' in navigator && 'ContactsManager' in window) {
        const props = ['name', 'email', 'tel'];
        const opts = { multiple: false };
        const contacts = await (navigator as any).contacts.select(props, opts);

        if (contacts && contacts.length > 0) {
          const contact = contacts[0];
          setFormData({
            name: contact.name?.[0] || '',
            email: contact.email?.[0] || '',
            phone: contact.tel?.[0] || '',
            company: '',
            title: '',
            metAt: '',
            tags: '',
            conversation: '',
            notes: ''
          });
          setCaptureMethod('manual');
        }
      } else {
        alert('Contact picker is not supported on this device. This feature works on Android devices with Chrome or Edge browsers.');
      }
    } catch (err) {
      console.error('Error picking contact:', err);
      if ((err as Error).name !== 'AbortError') {
        alert('Failed to access contacts. Please ensure you have granted permission.');
      }
    }
  };

  if (!captureMethod) {
    return (
      <div className="h-full bg-white flex flex-col">
        <div className="px-6 py-4 flex items-center border-b border-slate-200">
          <button onClick={onBack} className="p-2 -ml-2 active:bg-slate-100 rounded-full transition-colors" aria-label="Go back">
            <ArrowLeft size={24} className="text-slate-700" />
          </button>
          <h1 className="text-xl font-bold text-slate-900 ml-4">Add Contact</h1>
        </div>

        <div className="flex-1 px-6 py-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">How would you like to add this contact?</h2>
          <p className="text-slate-600 mb-8">Choose the method that works best for you</p>

          <div className="space-y-4">
            <button
              onClick={handlePickFromPhone}
              className="w-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-2xl p-6 shadow-lg active:scale-95 transition-transform text-left"
            >
              <Smartphone size={32} className="mb-3" />
              <div className="font-bold text-lg mb-1">Pick from Phone</div>
              <div className="text-cyan-100 text-sm">Import contact from your device</div>
            </button>

            <button
              onClick={() => setCaptureMethod('photo')}
              className="w-full bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-2xl p-6 shadow-lg active:scale-95 transition-transform text-left"
            >
              <Camera size={32} className="mb-3" />
              <div className="font-bold text-lg mb-1">Take Photo</div>
              <div className="text-orange-100 text-sm">Capture their face to remember them</div>
            </button>

            <button
              onClick={() => setCaptureMethod('card')}
              className="w-full bg-white border-2 border-slate-200 rounded-2xl p-6 active:bg-slate-50 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div className="font-bold text-lg mb-1 text-slate-900">Scan Business Card</div>
              <div className="text-slate-600 text-sm">Auto-extract contact information</div>
            </button>

            <button
              onClick={() => setCaptureMethod('manual')}
              className="w-full bg-white border-2 border-slate-200 rounded-2xl p-6 active:bg-slate-50 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
                <User size={24} className="text-slate-600" />
              </div>
              <div className="font-bold text-lg mb-1 text-slate-900">Enter Manually</div>
              <div className="text-slate-600 text-sm">Type in contact details yourself</div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (captureMethod === 'photo') {
    return (
      <div className="h-full bg-black flex flex-col">
        <div className="px-6 py-4 flex items-center justify-between">
          <button onClick={() => setCaptureMethod(null)} className="p-2 -ml-2 active:bg-white/20 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-white" />
          </button>
          <span className="text-white font-medium">Position their face in the circle</span>
          <div className="w-10"></div>
        </div>

        <div className="flex-1 flex items-center justify-center relative">
          <div className="w-64 h-64 rounded-full border-4 border-orange-500 border-dashed"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent"></div>
        </div>

        <div className="px-6 py-8 flex flex-col items-center gap-4">
          <label className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-transform cursor-pointer">
            <Camera size={32} className="text-slate-900" />
            <input
              type="file"
              accept="image/*"
              capture="user"
              onChange={handlePhotoCapture}
              className="hidden"
            />
          </label>
          <button
            onClick={() => setCaptureMethod('manual')}
            className="text-white font-medium"
          >
            Skip Photo
          </button>
        </div>
      </div>
    );
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    setLoading(true);

    try {
      let photoUrl = undefined;
      if (photoFile) {
        const { url, error: uploadError } = await uploadPhoto(photoFile);
        if (uploadError) throw new Error(uploadError);
        photoUrl = url || undefined;
      }

      const tagsArray = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const { error: addError } = await addContact({
        name: formData.name,
        company: formData.company || undefined,
        title: formData.title || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        photo_url: photoUrl,
        met_at: formData.metAt || undefined,
        met_date: new Date().toISOString().split('T')[0],
        notes: formData.notes || undefined,
        tags: tagsArray,
      });

      if (addError) throw new Error(addError);

      setSavedContactName(formData.name);
      setShowFollowUpModal(true);
    } catch (err: any) {
      setError(err.message || 'Failed to save contact');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center">
          <button
            onClick={() => {
              if (captureMethod) {
                setCaptureMethod(null);
                setFormData({
                  name: '',
                  company: '',
                  title: '',
                  email: '',
                  phone: '',
                  metAt: '',
                  tags: '',
                  conversation: '',
                  notes: ''
                });
                setPhotoFile(null);
                setPhotoPreview(null);
              } else {
                onBack();
              }
            }}
            className="p-2 -ml-2 active:bg-slate-100 rounded-full transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={24} className="text-slate-700" />
          </button>
          <h1 className="text-xl font-bold text-slate-900 ml-4">Contact Details</h1>
        </div>
        <button
          type="submit"
          form="contact-form"
          disabled={loading}
          className="text-orange-600 font-bold px-5 py-2.5 active:bg-orange-50 rounded-lg transition-colors disabled:opacity-50 text-lg"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>

      <form id="contact-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        <div className="flex justify-center mb-6">
          <label className="w-24 h-24 bg-gradient-to-br from-orange-500 to-amber-400 rounded-full flex items-center justify-center text-white shadow-lg relative cursor-pointer overflow-hidden">
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <User size={40} />
            )}
            <div className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
              <Camera size={16} className="text-slate-700" />
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoCapture}
              className="hidden"
            />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Full Name *
          </label>
          <div className="relative">
            <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              id="contact-name"
              name="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="John Doe"
              aria-label="Full name"
              aria-required="true"
              className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Company
            </label>
            <div className="relative">
              <Building2 size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={formData.company}
                onChange={(e) => handleChange('company', e.target.value)}
                placeholder="Acme Inc"
                className="w-full pl-10 pr-3 py-3.5 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Job Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="CEO"
              className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Email
          </label>
          <div className="relative">
            <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="john@example.com"
              className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Phone
          </label>
          <div className="relative">
            <Phone size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Where did you meet?
          </label>
          <div className="relative">
            <MapPin size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={formData.metAt}
              onChange={(e) => handleChange('metAt', e.target.value)}
              placeholder="Tech Conference 2025"
              className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Tags
          </label>
          <div className="relative">
            <Tag size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => handleChange('tags', e.target.value)}
              placeholder="client, investor, mentor"
              className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors"
            />
          </div>
          <p className="text-xs text-slate-500 mt-1.5">Separate tags with commas</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Conversation Summary
          </label>
          <textarea
            value={formData.conversation}
            onChange={(e) => handleChange('conversation', e.target.value)}
            placeholder="Key topics discussed, common interests, what they're working on..."
            rows={3}
            className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors resize-none"
          />
          <p className="text-xs text-slate-500 mt-1.5">Quick memory hooks to remember what you talked about</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Additional Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Add any other relevant information..."
            rows={3}
            className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors resize-none"
          />
        </div>
      </form>

      <div className="px-6 py-4 bg-white border-t border-slate-200">
        <button
          type="submit"
          form="contact-form"
          disabled={loading}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-transform disabled:opacity-50"
        >
          {loading ? 'Saving Contact...' : 'Save Contact'}
        </button>
      </div>

      {showFollowUpModal && (
        <FollowUpModal
          contactName={savedContactName}
          onClose={() => {
            setShowFollowUpModal(false);
            onSave();
          }}
          onSetReminder={(days) => {
            setShowFollowUpModal(false);
            onSave();
          }}
        />
      )}
    </div>
  );
}
