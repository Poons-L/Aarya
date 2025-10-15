import { useState } from 'react';
import { ArrowLeft, Save, Tag, User, Home, AlertCircle } from 'lucide-react';
import { Memory, useMemories } from '../hooks/useMemories';
import { Contact } from '../hooks/useContacts';

interface EditMemoryScreenProps {
  memory: Memory;
  contacts: Contact[];
  onBack: () => void;
  onSave: () => void;
  onHome: () => void;
}

export function EditMemoryScreen({ memory, contacts, onBack, onSave, onHome }: EditMemoryScreenProps) {
  const { updateMemory } = useMemories();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    text: memory.text,
    summary: memory.summary || '',
    tags: memory.tags?.join(', ') || '',
    linkedContactId: memory.linked_contact_id || null as string | null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const { error: updateError } = await updateMemory(memory.id, {
        text: formData.text,
        summary: formData.summary || undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
        linked_contact_id: formData.linkedContactId || undefined,
      });

      if (updateError) throw new Error(updateError);

      onSave();
    } catch (err: any) {
      setError(err.message || 'Failed to update memory');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-full transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={20} className="text-slate-700" />
          <span className="font-medium text-slate-700">Cancel</span>
        </button>
        <h1 className="text-xl font-bold text-slate-900">Edit Memory</h1>
        <button
          type="submit"
          form="edit-memory-form"
          disabled={loading}
          className="text-orange-600 font-bold px-5 py-2.5 active:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>

      <form id="edit-memory-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Memory Content *
          </label>
          <textarea
            value={formData.text}
            onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
            placeholder="Type your memory here..."
            rows={8}
            disabled={loading}
            className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors resize-none disabled:bg-slate-50"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Summary (Optional)
          </label>
          <textarea
            value={formData.summary}
            onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
            placeholder="Brief summary of this memory..."
            rows={3}
            disabled={loading}
            className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors resize-none disabled:bg-slate-50"
          />
          <p className="text-xs text-slate-500 mt-1.5">A short summary helps with quick recall</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Tags (Optional)
          </label>
          <div className="relative">
            <Tag size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="project, important, follow-up"
              disabled={loading}
              className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors disabled:bg-slate-50"
            />
          </div>
          <p className="text-xs text-slate-500 mt-1.5">Separate tags with commas</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Link to Contact (Optional)
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, linkedContactId: null }))}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors ${
                formData.linkedContactId === null
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-slate-200 bg-white active:bg-slate-50'
              }`}
            >
              <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                <User size={20} className="text-slate-500" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-slate-900">No Contact</div>
                <div className="text-sm text-slate-600">Not linked to anyone</div>
              </div>
            </button>
            {contacts.length > 0 ? (
              contacts.slice(0, 10).map(contact => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    linkedContactId: contact.id === prev.linkedContactId ? null : contact.id
                  }))}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors ${
                    formData.linkedContactId === contact.id
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
      </form>

      <div className="px-6 py-4 bg-white border-t border-slate-200 space-y-3">
        <button
          type="submit"
          form="edit-memory-form"
          disabled={loading}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            'Saving Changes...'
          ) : (
            <>
              <Save size={20} />
              Save Changes
            </>
          )}
        </button>
        <button
          type="button"
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
