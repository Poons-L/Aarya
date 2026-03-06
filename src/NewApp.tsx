import { useState, useEffect } from 'react';
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

type Screen =
  | 'welcome'
  | 'onboarding'
  | 'auth'
  | 'home'
  | 'contacts'
  | 'contact-detail'
  | 'add-contact'
  | 'edit-contact'
  | 'quick-capture'
  | 'reminders'
  | 'add-reminder'
  | 'profile';

type Tab = 'home' | 'contacts' | 'reminders' | 'profile';

function NewApp() {
  const { user, loading: authLoading } = useAuth();
  const { reminders } = useReminders();
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [contactToEdit, setContactToEdit] = useState<any>(null);
  const [preselectedContactId, setPreselectedContactId] = useState<string | null>(null);
  const [viewingContactId, setViewingContactId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        setCurrentScreen('home');
        setActiveTab('home');
      } else {
        setCurrentScreen('welcome');
      }
    }
  }, [user, authLoading]);

  const overdueCount = reminders.filter(
    r => !r.completed && new Date(r.due_date) < new Date()
  ).length;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500">
        <div className="text-white text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  const navigate = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setViewingContactId(null);
    switch (tab) {
      case 'home':
        navigate('home');
        break;
      case 'contacts':
        navigate('contacts');
        break;
      case 'reminders':
        navigate('reminders');
        break;
      case 'profile':
        navigate('profile');
        break;
    }
  };

  const showBottomNav =
    user &&
    ['home', 'contacts', 'reminders', 'profile'].includes(currentScreen);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen onGetStarted={() => navigate('onboarding')} />;

      case 'onboarding':
        return <OnboardingScreen onComplete={() => navigate('auth')} />;

      case 'auth':
        return (
          <AuthScreen
            onBack={() => navigate('welcome')}
            onAuth={() => navigate('home')}
          />
        );

      case 'home':
        return (
          <NewHomeScreen
            onNavigate={navigate}
            onSelectContact={(contactId) => {
              setSelectedContactId(contactId);
              navigate('contact-detail');
            }}
          />
        );

      case 'contacts':
        if (viewingContactId) {
          return (
            <NewContactDetailScreen
              contactId={viewingContactId}
              onBack={() => setViewingContactId(null)}
              onEdit={() => {
                setContactToEdit(viewingContactId);
                navigate('edit-contact');
              }}
              onAddReminder={() => {
                setPreselectedContactId(viewingContactId);
                navigate('add-reminder');
              }}
            />
          );
        }
        return (
          <NewContactsScreen
            onSelectContact={setViewingContactId}
            onAddContact={() => {
              setContactToEdit(null);
              navigate('add-contact');
            }}
          />
        );

      case 'contact-detail':
        if (!selectedContactId) {
          navigate('contacts');
          return null;
        }
        return (
          <NewContactDetailScreen
            contactId={selectedContactId}
            onBack={() => navigate('contacts')}
            onEdit={() => {
              setContactToEdit(selectedContactId);
              navigate('edit-contact');
            }}
            onAddReminder={() => {
              setPreselectedContactId(selectedContactId);
              navigate('add-reminder');
            }}
          />
        );

      case 'add-contact':
        return (
          <FullAddContactScreen
            onBack={() => navigate(activeTab)}
            onSave={() => navigate(activeTab)}
          />
        );

      case 'edit-contact':
        return (
          <FullAddContactScreen
            onBack={() => navigate('contact-detail')}
            onSave={() => navigate('contact-detail')}
            contactToEdit={contactToEdit}
          />
        );

      case 'quick-capture':
        return (
          <QuickCaptureScreen
            onBack={() => navigate('home')}
            onSave={() => navigate('home')}
          />
        );

      case 'reminders':
        return (
          <NewRemindersScreen
            onAddReminder={() => {
              setPreselectedContactId(null);
              navigate('add-reminder');
            }}
            onSelectContact={(contactId) => {
              setSelectedContactId(contactId);
              navigate('contact-detail');
            }}
          />
        );

      case 'add-reminder':
        return (
          <NewAddReminderScreen
            onBack={() => navigate('reminders')}
            onSave={() => navigate('reminders')}
            preselectedContactId={preselectedContactId || undefined}
          />
        );

      case 'profile':
        return (
          <NewProfileScreen
            onSignOut={() => navigate('welcome')}
          />
        );

      default:
        return <WelcomeScreen onGetStarted={() => navigate('auth')} />;
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
