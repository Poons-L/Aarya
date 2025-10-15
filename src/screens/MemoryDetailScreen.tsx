import { useState } from 'react';
import { ArrowLeft, Trash2, Clock, Tag, User, MoreVertical, Home } from 'lucide-react';
import { Memory, useMemories } from '../hooks/useMemories';
import { Contact } from '../hooks/useContacts';

interface MemoryDetailScreenProps {
  memory: Memory;
  contacts: Contact[];
  onBack: () => void;
  onHome: () => void;
  onDelete: () => void;
}

export function MemoryDetailScreen({ memory, contacts, onBack, onHome, onDelete }: MemoryDetailScreenProps) {
  const { deleteMemory } = useMemories();
  const [showMenu, setShowMenu] = useState(false);

  const linkedContact = contacts.find(c => c.id === memory.linked_contact_id);

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this memory?')) {
      await deleteMemory(memory.id);
      onDelete();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getSourceLabel = (sourceType: string) => {
    switch (sourceType) {
      case 'voice':
        return 'Voice Recording';
      case 'ocr':
        return 'Photo Capture';
      default:
        return 'Text Note';
    }
  };

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="bg-gradient-to-br from-orange-500 to-amber-600 px-6 pt-14 pb-8">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full active:scale-95 transition-transform"
          >
            <ArrowLeft size={20} className="text-white" />
            <span className="font-medium text-white">Back</span>
          </button>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 bg-white/20 backdrop-blur-sm rounded-full active:scale-95 transition-transform relative"
          >
            <MoreVertical size={24} className="text-white" />
            {showMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl overflow-hidden z-10">
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-3 flex items-center gap-3 text-red-600 active:bg-red-50 transition-colors"
                >
                  <Trash2 size={18} />
                  <span className="font-medium">Delete Memory</span>
                </button>
              </div>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <Clock size={16} className="text-orange-100" />
          <span className="text-orange-100 text-sm">{formatDate(memory.created_at)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full">
            {getSourceLabel(memory.source_type)}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {memory.summary && (
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">Summary</h3>
            <p className="text-slate-700 leading-relaxed">{memory.summary}</p>
          </div>
        )}

        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-2">Full Content</h3>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{memory.text}</p>
          </div>
        </div>

        {memory.tags && memory.tags.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {memory.tags.map((tag, index) => (
                <span
                  key={index}
                  className="flex items-center gap-1.5 bg-orange-50 text-orange-700 px-3 py-2 rounded-xl text-sm font-medium"
                >
                  <Tag size={14} />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {linkedContact && (
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">Linked Contact</h3>
            <div className="bg-white border-2 border-slate-200 rounded-xl p-4 flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {linkedContact.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-900">{linkedContact.name}</div>
                {linkedContact.company && (
                  <div className="text-sm text-slate-600">{linkedContact.company}</div>
                )}
              </div>
              <User size={20} className="text-slate-400" />
            </div>
          </div>
        )}
      </div>

      <div className="px-6 py-4 bg-white border-t border-slate-200">
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
