import { useEffect, useState } from 'react';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { AuthScreen } from './screens/AuthScreen';
import { ResetPasswordScreen } from './screens/ResetPasswordScreen';
import { NewHomeScreen } from './screens/NewHomeScreen';
import { NewContactsScreen } from './screens/NewContactsScreen';
import { NewContactDetailScreen } from './screens/NewContactDetailScreen';
import { FullAddContactScreen } from './screens/FullAddContactScreen';
import { QuickCaptureScreen } from './screens/QuickCaptureScreen';
import { NewRemindersScreen } from './screens/NewRemindersScreen';
import { NewAddReminderScreen } from './screens/NewAddReminderScreen';
import { NewProfileScreen } from './screens/NewProfileScreen';
import OwnerAdminDashboard from './screens/OwnerAdminDashboard';
import { FeedbackScreen } from './screens/FeedbackScreen';
import { BottomTabNav } from './components/BottomTabNav';
import { useAuth } from './contexts/AuthContext';
import { useReminders } from './hooks/useReminders';
import { useReminderNotifications } from './hooks/useReminderNotifications';

type Tab = 'home' | 'contacts' | 'reminders' | 'profile';

interface NavState {
  screen: 'welcome' | 'onboarding' | 'auth' | 'resetPassword' | 'home' | 'contacts' | 'contactDetail' | 'addContact' | 'editContact' | 'quickCapture' | 'reminders' | 'addReminder' | 'profile' | 'admin' | 'feedback';
  contactId?: string | null;
  authMode?: 'signIn' | 'signUp';
}

function NewApp() {
  const [navState, setNavState] = useState<NavState>({ screen: 'welcome', contactId: null });
  const [history, setHistory] = useState<NavState[]>([]);

  const { user, loading: authLoading } = useAuth();
  const { reminders } = useReminders();
  useReminderNotifications(reminders);

  const overdueCount = reminders.filter(
    r => !r.completed && new Date(r.due_date) < new Date()
  ).length;

  const [oauthError, setOauthError] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      setNavState({ screen: 'resetPassword', contactId: null });
      setHistory([]);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('error_description') || params.get('error');
    if (errorParam) {
      setOauthError(decodeURIComponent(errorParam));
      window.history.replaceState({}, '', window.location.pathname);
    }

    if (hash) {
      const hashParams = new URLSearchParams(hash.substring(1));
      const hashError = hashParams.get('error_description') || hashParams.get('error');
      if (hashError) {
        setOauthError(decodeURIComponent(hashError));
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  useEffect(() => {
    if (!user && navState.screen !== 'welcome' && navState.screen !== 'onboarding' && navState.screen !== 'auth' && navState.screen !== 'resetPassword') {
      if (oauthError) {
        setNavState({ screen: 'auth', contactId: null });
      } else {
        setNavState({ screen: 'welcome', contactId: null });
      }
      setHistory([]);
    }
    if (user && (navState.screen === 'welcome' || navState.screen === 'onboarding' || navState.screen === 'auth')) {
      setOauthError(null);
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


  let screenContent = null;

  if (navState.screen === 'welcome') {
    screenContent = <WelcomeScreen
      onGetStarted={() => setNavState({ screen: 'onboarding', contactId: null })}
      onSignIn={() => setNavState({ screen: 'auth', contactId: null, authMode: 'signIn' })}
    />;
  } else if (navState.screen === 'onboarding') {
    screenContent = <OnboardingScreen onComplete={() => {
      setNavState({ screen: 'auth', contactId: null, authMode: 'signUp' });
    }} />;
  } else if (navState.screen === 'auth') {
    screenContent = <AuthScreen
      onBack={() => {
        setNavState({ screen: 'welcome', contactId: null });
      }}
      onAuth={() => {
        setNavState({ screen: 'home', contactId: null });
      }}
      initialError={oauthError}
      initialMode={navState.authMode}
    />;
  } else if (navState.screen === 'resetPassword') {
    screenContent = <ResetPasswordScreen
      onComplete={() => {
        window.location.hash = '';
        setNavState({ screen: 'auth', contactId: null });
      }}
    />;
  } else if (navState.screen === 'home') {
    screenContent = <NewHomeScreen
      onNavigate={(screen: string) => {
        setHistory(prev => [...prev, navState]);
        setNavState({ screen: screen as NavState['screen'], contactId: null });
      }}
      onViewContact={(contactId: string) => {
        setHistory(prev => [...prev, navState]);
        setNavState({ screen: 'contactDetail', contactId });
      }}
    />;
  } else if (navState.screen === 'contacts') {
    screenContent = <NewContactsScreen
      onViewContact={(contactId) => {
        setHistory(prev => [...prev, navState]);
        setNavState({ screen: 'contactDetail', contactId });
      }}
      onAddContact={() => {
        setNavState({ screen: 'addContact', contactId: null });
      }}
    />;
  } else if (navState.screen === 'contactDetail') {
    screenContent = <NewContactDetailScreen
      contactId={navState.contactId!}
      onBack={() => {
        if (history.length === 0) {
          setNavState({ screen: 'contacts', contactId: null });
        } else {
          const newHistory = [...history];
          const previousState = newHistory.pop()!;
          setHistory(newHistory);
          setNavState(previousState);
        }
      }}
      onEditContact={(contactId: string) => {
        setHistory(prev => [...prev, navState]);
        setNavState({ screen: 'editContact', contactId });
      }}
      onAddReminder={(contactId: string) => {
        setHistory(prev => [...prev, navState]);
        setNavState({ screen: 'addReminder', contactId });
      }}
      onQuickCapture={() => {
        setHistory(prev => [...prev, navState]);
        setNavState({ screen: 'quickCapture', contactId: null });
      }}
      onDeleted={() => {
        // Drop any history entries that point at the deleted contact so Back can't land on them
        const deletedId = navState.contactId;
        setHistory(prev => prev.filter(h => h.contactId !== deletedId));
        setNavState({ screen: 'contacts', contactId: null });
      }}
    />;
  } else if (navState.screen === 'addContact') {
    screenContent = <FullAddContactScreen
      onBack={() => {
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
        setNavState({ screen: 'contacts', contactId: null });
      }}
    />;
  } else if (navState.screen === 'editContact') {
    screenContent = <FullAddContactScreen
      contactId={navState.contactId!}
      onBack={() => {
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
        setNavState({ screen: 'home', contactId: null });
      }}
    />;
  } else if (navState.screen === 'reminders') {
    screenContent = <NewRemindersScreen
      onNavigate={(screen: string) => {
        setHistory(prev => [...prev, navState]);
        setNavState({ screen: screen as NavState['screen'], contactId: null });
      }}
      onViewContact={(contactId: string) => {
        setHistory(prev => [...prev, navState]);
        setNavState({ screen: 'contactDetail', contactId });
      }}
    />;
  } else if (navState.screen === 'addReminder') {
    screenContent = <NewAddReminderScreen
      contactId={navState.contactId ?? undefined}
      onBack={() => {
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
        setNavState({ screen: 'reminders', contactId: null });
      }}
    />;
  } else if (navState.screen === 'profile') {
    screenContent = <NewProfileScreen
      onNavigate={(screen: string) => {
        if (screen === 'welcome') {
          setNavState({ screen: 'welcome', contactId: null });
          setHistory([]);
        } else if (screen === 'admin') {
          setHistory(prev => [...prev, navState]);
          setNavState({ screen: 'admin', contactId: null });
        } else if (screen === 'feedback') {
          setHistory(prev => [...prev, navState]);
          setNavState({ screen: 'feedback', contactId: null });
        }
      }}
    />;
  } else if (navState.screen === 'admin') {
    screenContent = <OwnerAdminDashboard
      onBack={() => {
        if (history.length === 0) {
          setNavState({ screen: 'profile', contactId: null });
        } else {
          const newHistory = [...history];
          const previousState = newHistory.pop()!;
          setHistory(newHistory);
          setNavState(previousState);
        }
      }}
    />;
  } else if (navState.screen === 'feedback') {
    screenContent = <FeedbackScreen
      onBack={() => {
        if (history.length === 0) {
          setNavState({ screen: 'profile', contactId: null });
        } else {
          const newHistory = [...history];
          const previousState = newHistory.pop()!;
          setHistory(newHistory);
          setNavState(previousState);
        }
      }}
    />;
  } else {
    screenContent = <NewHomeScreen
      onNavigate={(screen: string) => {
        setHistory(prev => [...prev, navState]);
        setNavState({ screen: screen as NavState['screen'], contactId: null });
      }}
      onViewContact={(contactId: string) => {
        setHistory(prev => [...prev, navState]);
        setNavState({ screen: 'contactDetail', contactId });
      }}
    />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center">
      <div className="w-full max-w-[430px] min-h-screen bg-white shadow-xl flex flex-col relative z-0">
        <div className="flex-1 overflow-hidden relative">
          {screenContent}
        </div>
        {showBottomNav && (
          <BottomTabNav
            activeTab={activeTab}
            onTabChange={(tab: Tab) => {
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
