import { useState } from 'react';
import { Camera, Mic, Bell, ChevronRight } from 'lucide-react';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const slides = [
  {
    icon: Camera,
    title: 'Never Forget a Face',
    description: 'Snap a photo and add quick notes about everyone you meet. Build your network visually.',
    color: 'from-amber-400 to-orange-500',
  },
  {
    icon: Mic,
    title: 'Record Conversations',
    description: 'Capture key talking points with voice recording. Your AI assistant will help you remember what matters.',
    color: 'from-orange-500 to-pink-500',
  },
  {
    icon: Bell,
    title: 'Smart Follow-Up Reminders',
    description: 'Never miss a follow-up. Set reminders to stay in touch and strengthen your relationships.',
    color: 'from-pink-500 to-rose-500',
  },
];

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <div className={`h-full bg-gradient-to-br ${slide.color} flex flex-col items-center justify-between px-8 py-12 text-white transition-all duration-500`}>
      <button
        onClick={handleSkip}
        className="self-end text-white/90 font-medium px-4 py-2 active:bg-white/20 rounded-lg transition-colors"
      >
        Skip
      </button>

      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="bg-white/20 backdrop-blur-sm p-8 rounded-3xl mb-8 animate-fadeIn">
          <Icon size={80} className="text-white" strokeWidth={1.5} />
        </div>

        <h1 className="text-4xl font-bold mb-4 animate-fadeIn">{slide.title}</h1>
        <p className="text-lg text-white/90 max-w-sm leading-relaxed animate-fadeIn">
          {slide.description}
        </p>
      </div>

      <div className="w-full space-y-6">
        <div className="flex justify-center gap-2">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/40'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="w-full bg-white text-slate-900 font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          {currentSlide < slides.length - 1 ? (
            <>
              Next
              <ChevronRight size={20} />
            </>
          ) : (
            'Get Started'
          )}
        </button>
      </div>
    </div>
  );
}
