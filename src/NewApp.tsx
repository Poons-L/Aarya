import { useEffect } from 'react';
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
import { useNavigation } from './contexts/NavigationContext';

type Tab = 'home' | 'contacts' | 'reminders' | 'profile';

function NewApp() {
  const { user, loading: authLoading } = useAuth();
  const { reminders } = useReminders();
  const { currentScreen, navigate, goBack } = useNavigation();

  const overdueCount = reminders.filter(
    r => !r.completed && new Date(r.due_date) < new Date()
  ).length;

  useEffect(() => {
    if (!user && currentScreen.name !== 'welcome' && currentScreen.name !== 'onboarding' && currentScreen.name !== 'auth') {
      navigate({ name: 'welcome' });
    }
    if (user && (currentScreen.name === 'welcome' || currentScreen.name === 'onboarding' || currentScreen.name === 'auth')) {
      navigate({ name: 'home' });
    }
  }, [user, currentScreen.name, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500">
        <div className="text-white text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  const getActiveTab = (): Tab => {
    const screenName = currentScreen.name;
    if (screenName === 'contacts' || screenName === 'contactDetail' || screenName === 'addContact' || screenName === 'editContact') return 'contacts';
    if (screenName === 'reminders' || screenName === 'addReminder') return 'reminders';
    if (screenName === 'profile') return 'profile';
    return 'home';
  };

  const activeTab = getActiveTab();

  const showBottomNav = user && (
    currentScreen.name === 'home' ||
    currentScreen.name === 'contacts' ||
    currentScreen.name === 'contactDetail' ||
    currentScreen.name === 'reminders' ||
    currentScreen.name === 'profile'
  );

  const handleTabChange = (tab: Tab) => {
    navigate({ name: tab });
  };

  const renderScreen = () => {
    const screen = currentScreen;

    switch (screen.name) {
      case 'welcome':
        return <WelcomeScreen onGetStarted={() => navigate({ name: 'onboarding' })} />;
      case 'onboarding':
        return <OnboardingScreen onComplete={() => navigate({ name: 'auth' })} />;
      case 'auth':
        return <AuthScreen onBack={() => navigate({ name: 'welcome' })} onAuth={() => navigate({ name: 'home' })} />;
      case 'home':
        return <NewHomeScreen />;
      case 'contacts':
        return <NewContactsScreen />;
      case 'contactDetail':
        return <NewContactDetailScreen contactId={screen.contactId} onBack={goBack} />;
      case 'addContact':
        return <FullAddContactScreen onBack={goBack} onSave={() => navigate({ name: 'contacts' })} />;
      case 'editContact':
        return <FullAddContactScreen contactId={screen.contactId} onBack={goBack} onSave={goBack} />;
      case 'quickCapture':
        return <QuickCaptureScreen onBack={goBack} onComplete={() => navigate({ name: 'home' })} />;
      case 'reminders':
        return <NewRemindersScreen />;
      case 'addReminder':
        return <NewAddReminderScreen contactId={screen.contactId} onBack={goBack} onSave={() => navigate({ name: 'reminders' })} />;
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
