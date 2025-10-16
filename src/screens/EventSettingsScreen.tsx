import { useState, useEffect } from 'react';
import { ArrowLeft, User, Shield, Heart, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { Event, useEvents } from '../hooks/useEvents';

interface EventSettingsScreenProps {
  event: Event;
  onBack: () => void;
  onSave: () => void;
}

const PERSONAS = [
  { value: 'investor', label: 'Investor', description: 'Looking for investment opportunities' },
  { value: 'founder', label: 'Founder/Entrepreneur', description: 'Building or running a startup' },
  { value: 'developer', label: 'Developer/Engineer', description: 'Technical implementation focus' },
  { value: 'product', label: 'Product Manager', description: 'Product strategy and development' },
  { value: 'marketing', label: 'Marketing/Sales', description: 'Growth and customer acquisition' },
  { value: 'executive', label: 'Executive', description: 'Leadership and strategy' },
  { value: 'student', label: 'Student/Learner', description: 'Learning and networking' },
  { value: 'other', label: 'Other', description: 'Different role or multiple roles' },
];

const ACCESS_LEVELS = [
  { value: 'general', label: 'General Admission' },
  { value: 'vip', label: 'VIP Pass' },
  { value: 'speaker', label: 'Speaker' },
  { value: 'sponsor', label: 'Sponsor' },
  { value: 'press', label: 'Press/Media' },
  { value: 'volunteer', label: 'Volunteer/Staff' },
];

const INTEREST_TOPICS = [
  'AI/Machine Learning',
  'Web Development',
  'Mobile Development',
  'DevOps/Infrastructure',
  'Data Science',
  'Cybersecurity',
  'Blockchain/Web3',
  'Product Management',
  'UX/Design',
  'Marketing',
  'Sales',
  'Funding/Investment',
  'Leadership',
  'Entrepreneurship',
  'Networking',
];

export function EventSettingsScreen({ event, onBack, onSave }: EventSettingsScreenProps) {
  const { getUserEventPreference, saveUserEventPreference } = useEvents();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    persona: '',
    accessLevel: 'general',
    interests: [] as string[],
  });

  useEffect(() => {
    loadPreferences();
  }, [event.id]);

  const loadPreferences = async () => {
    setLoading(true);
    const { data } = await getUserEventPreference(event.id);

    if (data) {
      setFormData({
        persona: data.persona || '',
        accessLevel: data.access_level || 'general',
        interests: data.interests || [],
      });
    }

    setLoading(false);
  };

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      if (!formData.persona) {
        throw new Error('Please select your persona');
      }

      const { error: saveError } = await saveUserEventPreference({
        event_id: event.id,
        persona: formData.persona,
        access_level: formData.accessLevel,
        interests: formData.interests,
      });

      if (saveError) throw new Error(saveError);

      setSuccess(true);
      setTimeout(() => {
        onSave();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-600">Loading preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200">
        <button
          onClick={onBack}
          disabled={saving}
          className="text-slate-600 active:text-slate-900 transition-colors disabled:opacity-50"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-slate-900">Event Preferences</h1>
        <button
          type="submit"
          form="event-settings-form"
          disabled={saving}
          className="text-orange-600 font-bold px-4 py-2 active:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <form id="event-settings-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-center gap-3">
            <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
            <span className="text-sm text-green-700">Preferences saved successfully!</span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            <User size={16} className="inline mr-1.5" />
            Your Persona/Role *
          </label>
          <p className="text-sm text-slate-500 mb-4">
            This helps us recommend relevant sessions for you
          </p>
          <div className="space-y-2">
            {PERSONAS.map((persona) => (
              <button
                key={persona.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, persona: persona.value }))}
                className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                  formData.persona === persona.value
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-slate-200 bg-white active:bg-slate-50'
                }`}
              >
                <div className="font-semibold text-slate-900">{persona.label}</div>
                <div className="text-sm text-slate-600 mt-1">{persona.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            <Shield size={16} className="inline mr-1.5" />
            Access Level
          </label>
          <p className="text-sm text-slate-500 mb-4">
            Select your ticket or access type
          </p>
          <div className="space-y-2">
            {ACCESS_LEVELS.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, accessLevel: level.value }))}
                className={`w-full text-left p-3 rounded-xl border-2 transition-colors ${
                  formData.accessLevel === level.value
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-slate-200 bg-white active:bg-slate-50'
                }`}
              >
                <div className="font-medium text-slate-900">{level.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            <Heart size={16} className="inline mr-1.5" />
            Interests & Topics (Optional)
          </label>
          <p className="text-sm text-slate-500 mb-4">
            Select topics you're interested in for better session recommendations
          </p>
          <div className="flex flex-wrap gap-2">
            {INTEREST_TOPICS.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => toggleInterest(topic)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  formData.interests.includes(topic)
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-100 text-slate-700 active:bg-slate-200'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
          {formData.interests.length > 0 && (
            <p className="text-sm text-slate-600 mt-3">
              {formData.interests.length} topic{formData.interests.length > 1 ? 's' : ''} selected
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
