import { Home, Users, Bell, User } from 'lucide-react';

interface BottomTabNavProps {
  activeTab: 'home' | 'contacts' | 'reminders' | 'profile';
  onTabChange: (tab: 'home' | 'contacts' | 'reminders' | 'profile') => void;
  overdueCount?: number;
}

export function BottomTabNav({ activeTab, onTabChange, overdueCount = 0 }: BottomTabNavProps) {
  const tabs = [
    { id: 'home' as const, label: 'Home', icon: Home },
    { id: 'contacts' as const, label: 'Contacts', icon: Users },
    { id: 'reminders' as const, label: 'Reminders', icon: Bell, badge: overdueCount },
    { id: 'profile' as const, label: 'Profile', icon: User },
  ];

  return (
    <div className="bg-white border-t border-slate-200 px-2 py-2 flex items-center justify-around">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex flex-col items-center justify-center flex-1 py-2 relative"
          >
            <div className="relative">
              <Icon
                size={24}
                className={`transition-colors ${
                  isActive ? 'text-orange-500' : 'text-slate-400'
                }`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              {tab.badge && tab.badge > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                </div>
              )}
            </div>
            <span
              className={`text-xs mt-1 transition-colors ${
                isActive ? 'text-orange-500 font-semibold' : 'text-slate-500'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
