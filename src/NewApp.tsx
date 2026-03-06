import { useEffect, useState } from 'react';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { AuthScreen } from './screens/AuthScreen';
import { NewHomeScreen } from './screens/NewHomeScreen';
import { NewContactsScreen } from './screens/NewContactsScreen';
import { NewContactDetailScreen } from './screens/NewContactDetailScreen';
import { FullAddContactScreen } from './screens/FullAddContactScreen';
import { QuickCaptureScreen } from './screens/QuickCaptureScreen';
import { NewRemindersScreen } from './screens/NewRemindersScreen';
import { NewAddReminderScreen } from './screens/NewAddReminderScreen';
import { NewProfileScreen } from './screens/NewProfileScreen';
import { BottomTabNav } from './components/BottomTabNav';
import { useAuth } from './contexts/AuthContext';
import { useReminders } from './hooks/useReminders';

type Tab = 'home' | 'contacts' | 'reminders' | 'profile';

interface NavState {
  screen: 'welcome' | 'onboarding' | 'auth' | 'home' | 'contacts' | 'contactDetail' | 'addContact' | 'editContact' | 'quickCapture' | 'reminders' | 'addReminder' | 'profile';
  contactId?: string | null;
}

function NewApp() {
  const { user, loading: authLoading } = useAuth();
  const { reminders } = useReminders();
  const [navState, setNavState] = useState<NavState>({ screen: 'welcome', contactId: null });
  const [history, setHistory] = useState<NavState[]>([]);

  const overdueCount = reminders.filter(
    r => !r.completed && new Date(r.due_date) < new Date()
  ).length;

  const navigate = (newNavState: NavState) => {
    console.log('Navigate called:', newNavState);
    setHistory(prev => [...prev, navState]);
    setNavState(newNavState);
  };

  const goBack = () => {
    console.log('GoBack called, history length:', history.length);
    if (history.length === 0) return;
    const newHistory = [...history];
    const previousState = newHistory.pop()!;
    setHistory(newHistory);
    setNavState(previousState);
  };

  useEffect(() => {
    if (!user && navState.screen !== 'welcome' && navState.screen !== 'onboarding' && navState.screen !== 'auth') {
      setNavState({ screen: 'welcome', contactId: null });
    }
    if (user && (navState.screen === 'welcome' || navState.screen === 'onboarding' || navState.screen === 'auth')) {
      setNavState({ screen: 'home', contactId: null });
    }
  }, [user, navState.screen]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500">
        <div className="text-white text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  const getActiveTab = (): Tab => {
    const screenName = navState.screen;
    if (screenName === 'contacts' || screenName === 'contactDetail' || screenName === 'addContact' || screenName === 'editContact') return 'contacts';
    if (screenName === 'reminders' || screenName === 'addReminder') return 'reminders';
    if (screenName === 'profile') return 'profile';
    return 'home';
  };

  const activeTab = getActiveTab();

  const showBottomNav = user && (
    navState.screen === 'home' ||
    navState.screen === 'contacts' ||
    navState.screen === 'contactDetail' ||
    navState.screen === 'reminders' ||
    navState.screen === 'profile'
  );

  const handleTabChange = (tab: Tab) => {
    navigate({ screen: tab, contactId: null });
  };

  const renderScreen = () => {
    switch (navState.screen) {
      case 'welcome':
        return <WelcomeScreen onGetStarted={() => navigate({ screen: 'onboarding', contactId: null })} />;
      case 'onboarding':
        return <OnboardingScreen onComplete={() => navigate({ screen: 'auth', contactId: null })} />;
      case 'auth':
        return <AuthScreen onBack={() => navigate({ screen: 'welcome', contactId: null })} onAuth={() => navigate({ screen: 'home', contactId: null })} />;
      case 'home':
        return <NewHomeScreen />;
      case 'contacts':
        return (
          <NewContactsScreen
            onViewContact={(contactId) => {
              console.log('NewApp: onViewContact called with', contactId);
              setNavState({ screen: 'contactDetail', contactId });
            }}
            onAddContact={() => navigate({ screen: 'addContact', contactId: null })}
          />
        );
      case 'contactDetail':
        return <NewContactDetailScreen contactId={navState.contactId!} onBack={goBack} />;
      case 'addContact':
        return <FullAddContactScreen onBack={goBack} onSave={() => navigate({ screen: 'contacts', contactId: null })} />;
      case 'editContact':
        return <FullAddContactScreen contactId={navState.contactId!} onBack={goBack} onSave={goBack} />;
      case 'quickCapture':
        return <QuickCaptureScreen onBack={goBack} onComplete={() => navigate({ screen: 'home', contactId: null })} />;
      case 'reminders':
        return <NewRemindersScreen />;
      case 'addReminder':
        return <NewAddReminderScreen contactId={navState.contactId} onBack={goBack} onSave={() => navigate({ screen: 'reminders', contactId: null })} />;
      case 'profile':
        return <NewProfileScreen />;
      default:
        return <NewHomeScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center">
      <div className="w-full max-w-[430px] min-h-screen bg-white shadow-xl flex flex-col">
        <div className="flex-1 overflow-hidden">
          {renderScreen()}
        </div>
        {showBottomNav && (
          <BottomTabNav
            activeTab={activeTab}
            onTabChange={handleTabChange}
            overdueCount={overdueCount}
          />
        )}
      </div>
    </div>
  );
}

export default NewApp;
