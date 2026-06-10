import { useState, useEffect } from 'react';
import { ArrowLeft, Camera, X, Plus, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useContacts } from '../hooks/useContacts';
import { supabase } from '../lib/supabase';

interface FullAddContactScreenProps {
  contactId?: string;
  onBack: () => void;
  onSave: () => void;
}

export function FullAddContactScreen({ contactId, onBack, onSave }: FullAddContactScreenProps) {
  const { contacts, addContact, updateContact } = useContacts();

  const isEdit = !!contactId;
  const contactToEdit = isEdit && contactId ? contacts.find(c => c.id === contactId) : null;
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [smartPasteLoading, setSmartPasteLoading] = useState(false);
  const [showSmartPaste, setShowSmartPaste] = useState(!isEdit);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    title: '',
    phone: '',
    email: '',
    linkedin_url: '',
    met_at: '',
    met_date: new Date().toISOString().split('T')[0],
    notes: '',
    birthday: '',
  });

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Pre-populate form when editing and contact data is available
  useEffect(() => {
    if (isEdit && contactToEdit) {
      console.log('Pre-populating form with contact data:', contactToEdit);
      setFormData({
        name: contactToEdit.name || '',
        company: contactToEdit.company || '',
        title: contactToEdit.title || '',
        phone: contactToEdit.phone || '',
        email: contactToEdit.email || '',
        linkedin_url: contactToEdit.linkedin_url || '',
        met_at: contactToEdit.met_at || '',
        met_date: contactToEdit.met_date || new Date().toISOString().split('T')[0],
        notes: contactToEdit.notes || '',
        birthday: contactToEdit.birthday || '',
      });
      setPhotoPreview(contactToEdit.photo_url || '');
      setTags((contactToEdit.tags && Array.isArray(contactToEdit.tags)) ? contactToEdit.tags : []);
    }
  }, [isEdit, contactToEdit]);

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

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSmartPaste = async () => {
    if (!pastedText.trim()) {
      setNotification({ type: 'error', message: 'Please paste some text first' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setSmartPasteLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setNotification({ type: 'error', message: 'Not authenticated. Please log in.' });
        setTimeout(() => setNotification(null), 3000);
        setSmartPasteLoading(false);
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/smart-paste`;

      console.log('Calling smart-paste function with URL:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: pastedText }),
      });

      console.log('Smart-paste response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Smart-paste error:', errorData);
        throw new Error(errorData.error || 'Failed to parse text');
      }

      const result = await response.json();
      console.log('Smart-paste result:', result);

      if (result.success && result.data) {
        const data = result.data;
        const nameParts = [];
        if (data.first_name) nameParts.push(data.first_name);
        if (data.last_name) nameParts.push(data.last_name);
        const fullName = nameParts.length > 0 ? nameParts.join(' ') : null;

        setFormData({
          ...formData,
          name: fullName || formData.name,
          company: data.company || formData.company,
          title: data.job_title || formData.title,
          phone: data.phone || formData.phone,
          email: data.email || formData.email,
          linkedin_url: data.linkedin_url || formData.linkedin_url,
          notes: data.notes || formData.notes,
        });

        setNotification({ type: 'success', message: '✅ Contact details filled in!' });
        setTimeout(() => setNotification(null), 3000);
        setShowSmartPaste(false);
        setPastedText('');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Smart paste error:', error);
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Could not parse text. Please fill in manually.'
      });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setSmartPasteLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
      const contactData = {
        ...formData,
        photo_url: photoPreview,
        tags,
      };

      if (contactToEdit) {
        await updateContact(contactToEdit.id, contactData);
      } else {
        await addContact(contactData);
      }

      if (isEdit) {
        onSave();
      } else {
        onSave();
      }
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
        <button onClick={() => onBack()} className="text-slate-600 active:text-slate-900">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-semibold text-slate-900">
          {contactToEdit ? 'Edit Contact' : 'Add Contact'}
        </h1>
        <div className="w-6" />
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        <div className="px-6 py-6 space-y-6">
          {notification && (
            <div className={`p-4 rounded-xl ${
              notification.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {notification.message}
            </div>
          )}

          {!showSmartPaste ? (
            <button
              type="button"
              onClick={() => setShowSmartPaste(true)}
              className="w-full bg-gradient-to-r from-violet-50 to-fuchsia-50 border-2 border-violet-200 rounded-xl p-4 flex items-center justify-center gap-2 text-violet-700 font-medium active:scale-98 transition-transform"
            >
              <Sparkles size={20} />
              <span>Show Smart Paste</span>
              <ChevronDown size={20} />
            </button>
          ) : (
            <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 rounded-2xl p-4 shadow-sm border-2 border-violet-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white p-2 rounded-lg">
                    <Sparkles size={20} />
                  </div>
                  <h3 className="font-semibold text-violet-900">Smart Paste</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSmartPaste(false)}
                  className="text-violet-600 hover:text-violet-800"
                >
                  <ChevronUp size={20} />
                </button>
              </div>
              <div className="space-y-3">
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste anything - LinkedIn profile text, email signature, business card text..."
                  rows={4}
                  className="w-full px-4 py-3 bg-white border border-violet-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent resize-none"
                />
                <button
                  type="button"
                  onClick={handleSmartPaste}
                  disabled={smartPasteLoading || !pastedText.trim()}
                  className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed active:scale-98 transition-transform flex items-center justify-center gap-2"
                >
                  {smartPasteLoading ? (
                    <>
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      Auto-fill from text
                    </>
                  )}
                </button>
                <p className="text-xs text-violet-700">
                  Copy text from anywhere and our AI will extract contact details automatically
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-4xl font-semibold overflow-hidden">
                {photoPreview ? (
                  <img src={photoPreview} alt="Contact" className="w-full h-full object-cover" />
                ) : (
                  formData.name[0]?.toUpperCase() || '?'
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-orange-500 text-white p-2 rounded-full shadow-lg cursor-pointer active:scale-95 transition-transform">
                <Camera size={20} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Company
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Acme Corp"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Role / Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Senior Product Manager"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                LinkedIn URL
              </label>
              <input
                type="url"
                value={formData.linkedin_url}
                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/in/johndoe"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Where We Met
              </label>
              <select
                value={formData.met_at}
                onChange={(e) => setFormData({ ...formData, met_at: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              >
                <option value="">Select...</option>
                <option value="conference">Conference</option>
                <option value="event">Event</option>
                <option value="online">Online</option>
                <option value="introduction">Introduction</option>
                <option value="networking">Networking Event</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Date Met
              </label>
              <input
                type="date"
                value={formData.met_date}
                onChange={(e) => setFormData({ ...formData, met_date: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Birthday (Month & Day)
              </label>
              <div className="flex gap-3">
                <select
                  value={formData.birthday ? formData.birthday.split('-')[0] : ''}
                  onChange={(e) => {
                    const month = e.target.value;
                    const day = formData.birthday ? formData.birthday.split('-')[1] : '01';
                    setFormData({ ...formData, birthday: month ? `${month}-${day}` : '' });
                  }}
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                >
                  <option value="">Month</option>
                  <option value="01">January</option>
                  <option value="02">February</option>
                  <option value="03">March</option>
                  <option value="04">April</option>
                  <option value="05">May</option>
                  <option value="06">June</option>
                  <option value="07">July</option>
                  <option value="08">August</option>
                  <option value="09">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
                <select
                  value={formData.birthday ? formData.birthday.split('-')[1] : ''}
                  onChange={(e) => {
                    const day = e.target.value;
                    const month = formData.birthday ? formData.birthday.split('-')[0] : '01';
                    setFormData({ ...formData, birthday: day ? `${month}-${day}` : '' });
                  }}
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                >
                  <option value="">Day</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                    <option key={d} value={String(d).padStart(2, '0')}>{d}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-slate-400 mt-1">Used as a reconnection signal for dormant contacts</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add a tag..."
                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
              <button
                type="button"
                onClick={addTag}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg active:scale-95 transition-transform"
              >
                <Plus size={20} />
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm"
                  >
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)}>
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Personal Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any important details to remember..."
              rows={4}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
            />
          </div>
        </div>

        <div className="px-6 py-4 bg-white border-t border-slate-200">
          <button
            type="submit"
            disabled={loading || !formData.name.trim()}
            className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed active:scale-98 transition-transform"
          >
            {loading ? 'Saving...' : contactToEdit ? 'Update Contact' : 'Save Contact'}
          </button>
        </div>
      </form>
    </div>
  );
}
