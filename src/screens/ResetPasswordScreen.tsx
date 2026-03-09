import { useState } from 'react';
import { Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ResetPasswordScreenProps {
  onComplete: () => void;
}

export function ResetPasswordScreen({ onComplete }: ResetPasswordScreenProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword || !confirmPassword) {
      setError('Please enter and confirm your new password');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (err: any) {
      setError(`Failed to update password: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="h-full bg-white flex flex-col items-center justify-center px-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">
          Password Updated
        </h2>
        <p className="text-slate-600 text-center mb-6">
          Your password has been successfully updated. You can now sign in with your new password.
        </p>
        <button
          onClick={onComplete}
          className="bg-orange-500 text-white font-semibold px-8 py-3 rounded-xl shadow-lg active:scale-95 transition-transform"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="flex-1 px-8 py-12 overflow-y-auto">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">
          Reset Your Password
        </h2>
        <p className="text-slate-600 mb-8">
          Enter your new password below
        </p>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors"
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white font-semibold py-4 rounded-xl shadow-lg active:scale-95 transition-transform mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
