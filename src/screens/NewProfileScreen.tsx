import { useState } from 'react';
import { User, Mail, Camera, LogOut, Info, Bell, Shield, ChevronRight, Lock, MessageSquare, X, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useContacts } from '../hooks/useContacts';
import { useReminders } from '../hooks/useReminders';
import { getNotificationsEnabled, setNotificationsEnabled, notificationsSupported } from '../hooks/useReminderNotifications';

const OWNER_EMAIL = 'chicchori@gmail.com';
const APP_VERSION = '1.3.0';

type Sheet = 'notifications' | 'privacy' | 'about' | null;

interface NewProfileScreenProps {
  onNavigate: (screen: string) => void;
}

export function NewProfileScreen({ onNavigate }: NewProfileScreenProps) {
  const { profile, user, updateProfile, signOut } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(profile?.avatar_url || '');
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
  });
  const { contacts } = useContacts();
  const { reminders } = useReminders();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [notificationsOn, setNotificationsOn] = useState(getNotificationsEnabled);
  const [notificationsBlocked, setNotificationsBlocked] = useState(
    notificationsSupported() && Notification.permission === 'denied'
  );

  const toggleNotifications = async () => {
    const enabled = await setNotificationsEnabled(!notificationsOn);
    setNotificationsOn(enabled);
    setNotificationsBlocked(notificationsSupported() && Notification.permission === 'denied');
  };

  const handleExportData = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      version: APP_VERSION,
      profile: { full_name: profile?.full_name ?? null, email: user?.email ?? null },
      contacts,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      reminders: reminders.map(({ contact, ...rest }) => rest),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `re-me-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await updateProfile({
        full_name: formData.full_name,
        avatar_url: photoPreview
      });
      if (error) throw new Error(error);
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await signOut();
      onNavigate('welcome');
    }
  };

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col overflow-y-auto">
      <div className="px-6 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-8">Profile & Settings</h1>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-6">
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-4">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-4xl font-semibold overflow-hidden">
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={48} />
                )}
              </div>
              {editing && (
                <label className="absolute bottom-0 right-0 bg-orange-500 text-white p-2 rounded-full shadow-lg cursor-pointer active:scale-95 transition-transform">
                  <Camera size={20} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {editing ? (
              <div className="w-full space-y-3">
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Your name"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-center"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white py-2 rounded-lg font-medium disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setFormData({ full_name: profile?.full_name || '' });
                      setPhotoPreview(profile?.avatar_url || '');
                    }}
                    className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-slate-900 text-center mb-1">
                  {profile?.full_name || 'User'}
                </h2>
                <p className="text-sm text-slate-600 mb-4">{user?.email}</p>
                <button
                  onClick={() => setEditing(true)}
                  className="bg-orange-500 text-white px-6 py-2 rounded-lg font-medium active:scale-95 transition-transform"
                >
                  Edit Profile
                </button>
              </>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Mail size={20} className="text-orange-500" />
              <div className="flex-1">
                <div className="text-xs text-slate-500">Email</div>
                <div className="text-sm text-slate-900 font-medium">{user?.email}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-6 overflow-hidden">
          <h3 className="text-sm font-semibold text-slate-700 px-4 pt-4 pb-2">Settings</h3>

          <button
            onClick={() => setSheet('notifications')}
            className="w-full flex items-center justify-between p-4 border-t border-slate-200 active:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Bell size={20} className="text-slate-600" />
              <span className="text-slate-900 font-medium">Notifications</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{notificationsOn ? 'On' : 'Off'}</span>
              <ChevronRight size={20} className="text-slate-400" />
            </div>
          </button>

          <button
            onClick={() => setSheet('privacy')}
            className="w-full flex items-center justify-between p-4 border-t border-slate-200 active:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Shield size={20} className="text-slate-600" />
              <span className="text-slate-900 font-medium">Privacy & Data</span>
            </div>
            <ChevronRight size={20} className="text-slate-400" />
          </button>

          <button
            onClick={() => setSheet('about')}
            className="w-full flex items-center justify-between p-4 border-t border-slate-200 active:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Info size={20} className="text-slate-600" />
              <span className="text-slate-900 font-medium">About</span>
            </div>
            <ChevronRight size={20} className="text-slate-400" />
          </button>

          <button
            onClick={() => onNavigate('feedback')}
            className="w-full flex items-center justify-between p-4 border-t border-slate-200 active:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <MessageSquare size={20} className="text-slate-600" />
              <span className="text-slate-900 font-medium">Send Feedback</span>
            </div>
            <ChevronRight size={20} className="text-slate-400" />
          </button>

          {user?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase() && (
            <button
              onClick={() => onNavigate('admin')}
              className="w-full flex items-center justify-between p-4 border-t border-slate-200 active:bg-slate-50 transition-colors bg-gradient-to-r from-orange-50 to-pink-50"
            >
              <div className="flex items-center gap-3">
                <Lock size={20} className="text-orange-600" />
                <span className="text-slate-900 font-medium">Admin Dashboard</span>
              </div>
              <ChevronRight size={20} className="text-orange-400" />
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 mb-6">
          <div className="text-center text-xs text-slate-500 space-y-1">
            <div className="font-semibold text-slate-700">Re.Me Networking Assistant</div>
            <div>Version {APP_VERSION}</div>
            <div>Never forget a connection</div>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full bg-red-500 text-white p-4 rounded-xl shadow-md active:scale-98 transition-transform"
        >
          <div className="flex items-center justify-center gap-2">
            <LogOut size={20} />
            <span className="font-semibold">Sign Out</span>
          </div>
        </button>
      </div>

      {sheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setSheet(null)}>
          <div
            className="w-full max-w-[430px] bg-white rounded-t-3xl p-6 pb-10 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">
                {sheet === 'notifications' ? 'Notifications' : sheet === 'privacy' ? 'Privacy & Data' : 'About Re.Me'}
              </h2>
              <button onClick={() => setSheet(null)} className="p-1 text-slate-400" aria-label="Close">
                <X size={20} />
              </button>
            </div>

            {sheet === 'notifications' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="pr-4">
                    <div className="font-medium text-slate-900">Reminder alerts</div>
                    <div className="text-xs text-slate-600 mt-1">
                      Get a browser notification when a follow-up comes due while Re.Me is open.
                    </div>
                  </div>
                  <button
                    role="switch"
                    aria-checked={notificationsOn}
                    onClick={toggleNotifications}
                    disabled={!notificationsSupported() || (notificationsBlocked && !notificationsOn)}
                    className={`relative w-12 h-7 rounded-full flex-shrink-0 transition-colors disabled:opacity-40 ${
                      notificationsOn ? 'bg-orange-500' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${
                        notificationsOn ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
                {!notificationsSupported() && (
                  <p className="text-xs text-slate-500">This browser doesn't support notifications.</p>
                )}
                {notificationsBlocked && (
                  <p className="text-xs text-red-600">
                    Notifications are blocked for this site. Allow them in your browser's site settings, then try again.
                  </p>
                )}
                <p className="text-xs text-slate-500">
                  Overdue reminders always show as a badge on the Reminders tab.
                </p>
              </div>
            )}

            {sheet === 'privacy' && (
              <div className="space-y-4 text-sm text-slate-700">
                <p>
                  Your contacts, notes and reminders are stored in your private account. Database
                  security rules mean only you can read or change them.
                </p>
                <p>
                  AI features (talking points, conversation starters, smart paste and voice
                  transcription) send the relevant contact details or audio to OpenAI to generate a
                  result.
                </p>
                <button
                  onClick={handleExportData}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white py-3 rounded-xl font-medium active:scale-95 transition-transform"
                >
                  <Download size={18} />
                  Export my data ({contacts.length} contacts, {reminders.length} reminders)
                </button>
                <p className="text-xs text-slate-500">
                  Downloads a JSON file. To delete your account and all data, send a request via Send Feedback.
                </p>
              </div>
            )}

            {sheet === 'about' && (
              <div className="space-y-3 text-sm text-slate-700">
                <p>
                  Re.Me is your networking assistant: capture people you meet, remember what you talked
                  about, and get a nudge (and talking points) before you reconnect.
                </p>
                <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-1">
                  <div>Version {APP_VERSION}</div>
                  <div>Signed in as {user?.email}</div>
                </div>
                <button
                  onClick={() => {
                    setSheet(null);
                    onNavigate('feedback');
                  }}
                  className="w-full bg-slate-100 text-slate-800 py-3 rounded-xl font-medium active:scale-95 transition-transform"
                >
                  Send Feedback
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
