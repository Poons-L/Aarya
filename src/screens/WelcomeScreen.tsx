import { Users } from 'lucide-react';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  return (
    <div className="h-full bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 flex flex-col items-center justify-between px-8 py-16 text-white">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="bg-white/20 backdrop-blur-sm p-6 rounded-3xl mb-8">
          <Users size={64} className="text-white" />
        </div>
        <h1 className="text-5xl font-bold mb-4">Re.Me</h1>
        <p className="text-xl text-orange-50 mb-2">Your Networking Assistant</p>
        <p className="text-sm text-orange-100 max-w-sm">
          Never forget a name, face, or conversation again. Capture connections effortlessly and stay in touch with ease.
        </p>
      </div>

      <div className="w-full space-y-3">
        <button
          onClick={onGetStarted}
          className="w-full bg-white text-orange-600 font-semibold py-4 rounded-2xl shadow-lg active:scale-95 transition-transform"
        >
          Get Started
        </button>
        <button
          onClick={onGetStarted}
          className="w-full bg-white/20 backdrop-blur-sm text-white font-semibold py-4 rounded-2xl border-2 border-white/40 active:scale-95 transition-transform"
        >
          Sign In
        </button>
      </div>
    </div>
  );
}
