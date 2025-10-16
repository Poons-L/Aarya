import { Brain, Search, Plus, Bell, Settings } from 'lucide-react';

interface BottomNavProps {
  active?: string;
  currentScreen?: string;
  onNavigate: (screen: string) => void;
}

export function BottomNav({ active, currentScreen, onNavigate }: BottomNavProps) {
  const activeScreen = active || currentScreen || 'home';

  return (
    <div className="bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-around">
      <button
        onClick={() => onNavigate('home')}
        className={`flex flex-col items-center gap-1 ${
          activeScreen === 'home' ? 'text-orange-600' : 'text-slate-400'
        }`}
      >
        <Brain size={24} />
        <span className="text-xs font-medium">Home</span>
      </button>
      <button
        onClick={() => onNavigate('search')}
        className={`flex flex-col items-center gap-1 ${
          activeScreen === 'search' ? 'text-orange-600' : 'text-slate-400'
        }`}
      >
        <Search size={24} />
        <span className="text-xs font-medium">Search</span>
      </button>
      <button
        onClick={() => onNavigate('add-memory')}
        className="flex flex-col items-center gap-1 text-slate-400"
      >
        <div className="w-12 h-12 -mt-6 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg">
          <Plus size={28} className="text-white" />
        </div>
      </button>
      <button
        onClick={() => onNavigate('reminders')}
        className={`flex flex-col items-center gap-1 ${
          activeScreen === 'reminders' ? 'text-orange-600' : 'text-slate-400'
        }`}
      >
        <Bell size={24} />
        <span className="text-xs font-medium">Reminders</span>
      </button>
      <button
        onClick={() => onNavigate('settings')}
        className={`flex flex-col items-center gap-1 ${
          activeScreen === 'settings' ? 'text-orange-600' : 'text-slate-400'
        }`}
      >
        <Settings size={24} />
        <span className="text-xs font-medium">Settings</span>
      </button>
    </div>
  );
}
