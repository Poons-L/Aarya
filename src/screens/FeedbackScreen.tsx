import { useState } from 'react';
import { ArrowLeft, Star, Send, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface FeedbackScreenProps {
  onBack: () => void;
}

const CATEGORIES = ['Bug Report', 'Feature Request', 'General Feedback', 'UI/UX'] as const;

export function FeedbackScreen({ onBack }: FeedbackScreenProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState<string>('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!rating || !category || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('feedback').insert({
        user_id: user.id,
        rating,
        category,
        message: message.trim(),
        app_version: '1.0.0',
      });

      if (error) throw error;
      setSubmitted(true);
      setTimeout(() => onBack(), 1800);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="h-full bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center px-6">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center max-w-sm w-full">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-green-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Thanks for your feedback!</h2>
          <p className="text-sm text-slate-500">Your input helps us improve Re.Me.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <button onClick={onBack} className="text-slate-600 active:text-slate-900">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-semibold text-slate-900">Send Feedback</h1>
        <div className="w-6" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Rating */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <label className="block text-sm font-medium text-slate-700 mb-3">
            How's your experience? <span className="text-red-500">*</span>
          </label>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="p-1 active:scale-110 transition-transform"
              >
                <Star
                  size={32}
                  className={star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-center text-xs text-slate-500 mt-2">
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Great'}
              {rating === 5 && 'Excellent'}
            </p>
          )}
        </div>

        {/* Category */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Category <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                  category === cat
                    ? 'bg-orange-50 border-orange-300 text-orange-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600 active:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Tell us more... <span className="text-xs text-slate-400">(optional)</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 500))}
            placeholder="What's working well? What could be better?"
            rows={4}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none text-sm"
          />
          <div className="text-right text-xs text-slate-400 mt-1">{message.length}/500</div>
        </div>
      </div>

      {/* Submit */}
      <div className="px-6 py-4 bg-white border-t border-slate-200">
        <button
          onClick={handleSubmit}
          disabled={loading || !rating || !category}
          className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-3 rounded-xl font-semibold disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send size={18} />
              Submit Feedback
            </>
          )}
        </button>
      </div>
    </div>
  );
}
