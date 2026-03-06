import { useState } from 'react';
import { User, Mail, Camera, LogOut, Info, Bell, Shield, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NewProfileScreenProps {
  onNavigate: (screen: any) => void;
}

export function NewProfileScreen({ onNavigate }: NewProfileScreenProps) {
  const { profile, user, updateProfile, signOut } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(profile?.avatar_url || '');
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
  });

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
      await updateProfile({
        full_name: formData.full_name,
        avatar_url: photoPreview
      });
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
      onNavigate({ name: 'welcome' });
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

          <button className="w-full flex items-center justify-between p-4 border-t border-slate-200 active:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <Bell size={20} className="text-slate-600" />
              <span className="text-slate-900 font-medium">Notifications</span>
            </div>
            <ChevronRight size={20} className="text-slate-400" />
          </button>

          <button className="w-full flex items-center justify-between p-4 border-t border-slate-200 active:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <Shield size={20} className="text-slate-600" />
              <span className="text-slate-900 font-medium">Privacy</span>
            </div>
            <ChevronRight size={20} className="text-slate-400" />
          </button>

          <button className="w-full flex items-center justify-between p-4 border-t border-slate-200 active:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <Info size={20} className="text-slate-600" />
              <span className="text-slate-900 font-medium">About</span>
            </div>
            <ChevronRight size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 mb-6">
          <div className="text-center text-xs text-slate-500 space-y-1">
            <div className="font-semibold text-slate-700">Re.Me Networking Assistant</div>
            <div>Version 1.0.0</div>
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
    </div>
  );
}
