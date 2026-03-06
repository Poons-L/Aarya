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
  const [navState, setNavState] = useState<NavState>({ screen: 'welcome', contactId: null });
  const [history, setHistory] = useState<NavState[]>([]);

  const { user, loading: authLoading } = useAuth();
  const { reminders } = useReminders();

  const overdueCount = reminders.filter(
    r => !r.completed && new Date(r.due_date) < new Date()
  ).length;

  useEffect(() => {
    console.log('navState changed:', navState);
  }, [navState]);

  useEffect(() => {
    if (!user && navState.screen !== 'welcome' && navState.screen !== 'onboarding' && navState.screen !== 'auth') {
      setNavState({ screen: 'welcome', contactId: null });
      setHistory([]);
    }
    if (user && (navState.screen === 'welcome' || navState.screen === 'onboarding' || navState.screen === 'auth')) {
      setNavState({ screen: 'home', contactId: null });
      setHistory([]);
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

  console.log('Rendering NewApp with navState:', navState);

  let screenContent = null;

  if (navState.screen === 'welcome') {
    screenContent = <WelcomeScreen onGetStarted={() => {
      console.log('Welcome: onGetStarted clicked');
      setNavState({ screen: 'onboarding', contactId: null });
    }} />;
  } else if (navState.screen === 'onboarding') {
    screenContent = <OnboardingScreen onComplete={() => {
      console.log('Onboarding: onComplete clicked');
      setNavState({ screen: 'auth', contactId: null });
    }} />;
  } else if (navState.screen === 'auth') {
    screenContent = <AuthScreen
      onBack={() => {
        console.log('Auth: onBack clicked');
        setNavState({ screen: 'welcome', contactId: null });
      }}
      onAuth={() => {
        console.log('Auth: onAuth success');
        setNavState({ screen: 'home', contactId: null });
      }}
    />;
  } else if (navState.screen === 'home') {
    screenContent = <NewHomeScreen />;
  } else if (navState.screen === 'contacts') {
    screenContent = <NewContactsScreen
      onViewContact={(contactId) => {
        console.log('Contacts: onViewContact clicked with', contactId);
        setNavState({ screen: 'contactDetail', contactId });
      }}
      onAddContact={() => {
        console.log('Contacts: onAddContact clicked');
        setNavState({ screen: 'addContact', contactId: null });
      }}
    />;
  } else if (navState.screen === 'contactDetail') {
    screenContent = <NewContactDetailScreen
      contactId={navState.contactId!}
      onBack={() => {
        console.log('ContactDetail: onBack clicked');
        if (history.length === 0) {
          setNavState({ screen: 'contacts', contactId: null });
        } else {
          const newHistory = [...history];
          const previousState = newHistory.pop()!;
          setHistory(newHistory);
          setNavState(previousState);
        }
      }}
    />;
  } else if (navState.screen === 'addContact') {
    screenContent = <FullAddContactScreen
      onBack={() => {
        console.log('AddContact: onBack clicked');
        if (history.length === 0) {
          setNavState({ screen: 'contacts', contactId: null });
        } else {
          const newHistory = [...history];
          const previousState = newHistory.pop()!;
          setHistory(newHistory);
          setNavState(previousState);
        }
      }}
      onSave={() => {
        console.log('AddContact: onSave clicked');
        setNavState({ screen: 'contacts', contactId: null });
      }}
    />;
  } else if (navState.screen === 'editContact') {
    screenContent = <FullAddContactScreen
      contactId={navState.contactId!}
      onBack={() => {
        console.log('EditContact: onBack clicked');
        if (history.length === 0) {
          setNavState({ screen: 'contacts', contactId: null });
        } else {
          const newHistory = [...history];
          const previousState = newHistory.pop()!;
          setHistory(newHistory);
          setNavState(previousState);
        }
      }}
      onSave={() => {
        console.log('EditContact: onSave clicked');
        if (history.length === 0) {
          setNavState({ screen: 'contacts', contactId: null });
        } else {
          const newHistory = [...history];
          const previousState = newHistory.pop()!;
          setHistory(newHistory);
          setNavState(previousState);
        }
      }}
    />;
  } else if (navState.screen === 'quickCapture') {
    screenContent = <QuickCaptureScreen
      onBack={() => {
        console.log('QuickCapture: onBack clicked');
        if (history.length === 0) {
          setNavState({ screen: 'home', contactId: null });
        } else {
          const newHistory = [...history];
          const previousState = newHistory.pop()!;
          setHistory(newHistory);
          setNavState(previousState);
        }
      }}
      onComplete={() => {
        console.log('QuickCapture: onComplete clicked');
        setNavState({ screen: 'home', contactId: null });
      }}
    />;
  } else if (navState.screen === 'reminders') {
    screenContent = <NewRemindersScreen />;
  } else if (navState.screen === 'addReminder') {
    screenContent = <NewAddReminderScreen
      contactId={navState.contactId}
      onBack={() => {
        console.log('AddReminder: onBack clicked');
        if (history.length === 0) {
          setNavState({ screen: 'reminders', contactId: null });
        } else {
          const newHistory = [...history];
          const previousState = newHistory.pop()!;
          setHistory(newHistory);
          setNavState(previousState);
        }
      }}
      onSave={() => {
        console.log('AddReminder: onSave clicked');
        setNavState({ screen: 'reminders', contactId: null });
      }}
    />;
  } else if (navState.screen === 'profile') {
    screenContent = <NewProfileScreen />;
  } else {
    screenContent = <NewHomeScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center">
      <div className="w-full max-w-[430px] min-h-screen bg-white shadow-xl flex flex-col">
        <div className="flex-1 overflow-hidden">
          {screenContent}
        </div>
        {showBottomNav && (
          <BottomTabNav
            activeTab={activeTab}
            onTabChange={(tab: Tab) => {
              console.log('BottomNav: tab changed to', tab);
              setHistory(prev => [...prev, navState]);
              setNavState({ screen: tab, contactId: null });
            }}
            overdueCount={overdueCount}
          />
        )}
      </div>
    </div>
  );
}

export default NewApp;
