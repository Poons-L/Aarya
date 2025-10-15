import { User, Check, X } from 'lucide-react';
import { useState } from 'react';

interface ContactInfo {
  name?: string;
  title?: string;
  company?: string;
  email?: string;
  phone?: string;
}

interface ContactSuggestionProps {
  contactInfo: ContactInfo;
  onAccept: (contactInfo: ContactInfo) => void;
  onReject: () => void;
}

export function ContactSuggestion({ contactInfo, onAccept, onReject }: ContactSuggestionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedInfo, setEditedInfo] = useState(contactInfo);

  const hasValidInfo = contactInfo.name || contactInfo.email || contactInfo.phone;

  if (!hasValidInfo) return null;

  return (
    <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-200 rounded-2xl p-4 mb-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white flex-shrink-0">
          <User size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-cyan-900 mb-1">Contact Detected</div>
          <div className="text-sm text-cyan-700">
            Would you like to save this as a new contact?
          </div>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-3 mb-3">
          <input
            type="text"
            placeholder="Name"
            value={editedInfo.name || ''}
            onChange={(e) => setEditedInfo({ ...editedInfo, name: e.target.value })}
            className="w-full px-3 py-2 border-2 border-cyan-200 rounded-lg focus:border-cyan-500 focus:outline-none text-sm"
          />
          <input
            type="text"
            placeholder="Title"
            value={editedInfo.title || ''}
            onChange={(e) => setEditedInfo({ ...editedInfo, title: e.target.value })}
            className="w-full px-3 py-2 border-2 border-cyan-200 rounded-lg focus:border-cyan-500 focus:outline-none text-sm"
          />
          <input
            type="text"
            placeholder="Company"
            value={editedInfo.company || ''}
            onChange={(e) => setEditedInfo({ ...editedInfo, company: e.target.value })}
            className="w-full px-3 py-2 border-2 border-cyan-200 rounded-lg focus:border-cyan-500 focus:outline-none text-sm"
          />
          <input
            type="email"
            placeholder="Email"
            value={editedInfo.email || ''}
            onChange={(e) => setEditedInfo({ ...editedInfo, email: e.target.value })}
            className="w-full px-3 py-2 border-2 border-cyan-200 rounded-lg focus:border-cyan-500 focus:outline-none text-sm"
          />
          <input
            type="tel"
            placeholder="Phone"
            value={editedInfo.phone || ''}
            onChange={(e) => setEditedInfo({ ...editedInfo, phone: e.target.value })}
            className="w-full px-3 py-2 border-2 border-cyan-200 rounded-lg focus:border-cyan-500 focus:outline-none text-sm"
          />
        </div>
      ) : (
        <div className="bg-white/50 rounded-xl p-3 mb-3 space-y-2">
          {contactInfo.name && (
            <div className="text-sm">
              <span className="font-semibold text-slate-700">Name:</span>{' '}
              <span className="text-slate-900">{contactInfo.name}</span>
            </div>
          )}
          {contactInfo.title && (
            <div className="text-sm">
              <span className="font-semibold text-slate-700">Title:</span>{' '}
              <span className="text-slate-900">{contactInfo.title}</span>
            </div>
          )}
          {contactInfo.company && (
            <div className="text-sm">
              <span className="font-semibold text-slate-700">Company:</span>{' '}
              <span className="text-slate-900">{contactInfo.company}</span>
            </div>
          )}
          {contactInfo.email && (
            <div className="text-sm">
              <span className="font-semibold text-slate-700">Email:</span>{' '}
              <span className="text-slate-900">{contactInfo.email}</span>
            </div>
          )}
          {contactInfo.phone && (
            <div className="text-sm">
              <span className="font-semibold text-slate-700">Phone:</span>{' '}
              <span className="text-slate-900">{contactInfo.phone}</span>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        {isEditing ? (
          <>
            <button
              type="button"
              onClick={() => {
                onAccept(editedInfo);
                setIsEditing(false);
              }}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-2.5 px-4 rounded-xl shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <Check size={18} />
              Save Contact
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setEditedInfo(contactInfo);
              }}
              className="px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl font-medium text-slate-700 active:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-2.5 px-4 rounded-xl shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <Check size={18} />
              Add Contact
            </button>
            <button
              type="button"
              onClick={onReject}
              className="px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl font-medium text-slate-700 active:bg-slate-50 transition-colors flex items-center justify-center"
            >
              <X size={18} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
