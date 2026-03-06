import { useReducer } from 'react';
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

type Screen =
  | { name: 'welcome' }
  | { name: 'onboarding' }
  | { name: 'auth' }
  | { name: 'home' }
  | { name: 'contacts' }
  | { name: 'contactDetail'; contactId: string }
  | { name: 'addContact' }
  | { name: 'editContact'; contactId: string }
  | { name: 'quickCapture' }
  | { name: 'reminders' }
  | { name: 'addReminder'; contactId?: string }
  | { name: 'profile' };

type NavigationAction =
  | { type: 'NAVIGATE'; screen: Screen }
  | { type: 'VIEW_CONTACT'; contactId: string }
  | { type: 'EDIT_CONTACT'; contactId: string }
  | { type: 'ADD_REMINDER'; contactId?: string }
  | { type: 'GO_BACK' };

interface NavigationState {
  currentScreen: Screen;
  history: Screen[];
}

function navigationReducer(state: NavigationState, action: NavigationAction): NavigationState {
  switch (action.type) {
    case 'NAVIGATE':
      return {
        currentScreen: action.screen,
        history: [...state.history, state.currentScreen]
      };
    case 'VIEW_CONTACT':
      return {
        currentScreen: { name: 'contactDetail', contactId: action.contactId },
        history: [...state.history, state.currentScreen]
      };
    case 'EDIT_CONTACT':
      return {
        currentScreen: { name: 'editContact', contactId: action.contactId },
        history: [...state.history, state.currentScreen]
      };
    case 'ADD_REMINDER':
      return {
        currentScreen: { name: 'addReminder', contactId: action.contactId },
        history: [...state.history, state.currentScreen]
      };
    case 'GO_BACK':
      if (state.history.length === 0) return state;
      const newHistory = [...state.history];
      const previousScreen = newHistory.pop()!;
      return {
        currentScreen: previousScreen,
        history: newHistory
      };
    default:
      return state;
  }
}

function NewApp() {
  const { user, loading: authLoading } = useAuth();
  const { reminders } = useReminders();

  const [state, dispatch] = useReducer(navigationReducer, {
    currentScreen: { name: 'welcome' },
    history: []
  });

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

  // Redirect to welcome if not authenticated and not on public screens
  if (!user && state.currentScreen.name !== 'welcome' && state.currentScreen.name !== 'onboarding' && state.currentScreen.name !== 'auth') {
    dispatch({ type: 'NAVIGATE', screen: { name: 'welcome' } });
  }

  // Redirect to home if authenticated and on public screens
  if (user && (state.currentScreen.name === 'welcome' || state.currentScreen.name === 'onboarding' || state.currentScreen.name === 'auth')) {
    dispatch({ type: 'NAVIGATE', screen: { name: 'home' } });
  }

  const navigate = (screen: Screen) => {
    dispatch({ type: 'NAVIGATE', screen });
  };

  const goBack = () => {
    dispatch({ type: 'GO_BACK' });
  };

  const getActiveTab = (): Tab => {
    const screenName = state.currentScreen.name;
    if (screenName === 'contacts' || screenName === 'contactDetail' || screenName === 'addContact' || screenName === 'editContact') return 'contacts';
    if (screenName === 'reminders' || screenName === 'addReminder') return 'reminders';
    if (screenName === 'profile') return 'profile';
    return 'home';
  };

  const activeTab = getActiveTab();

  const showBottomNav = user && (
    state.currentScreen.name === 'home' ||
    state.currentScreen.name === 'contacts' ||
    state.currentScreen.name === 'contactDetail' ||
    state.currentScreen.name === 'reminders' ||
    state.currentScreen.name === 'profile'
  );

  const handleTabChange = (tab: Tab) => {
    navigate({ name: tab });
  };

  const renderScreen = () => {
    const screen = state.currentScreen;

    switch (screen.name) {
      case 'welcome':
        return <WelcomeScreen onGetStarted={() => navigate({ name: 'onboarding' })} />;
      case 'onboarding':
        return <OnboardingScreen onComplete={() => navigate({ name: 'auth' })} />;
      case 'auth':
        return <AuthScreen onBack={() => navigate({ name: 'welcome' })} onAuth={() => navigate({ name: 'home' })} />;
      case 'home':
        return <NewHomeScreen onNavigate={navigate} dispatch={dispatch} />;
      case 'contacts':
        return <NewContactsScreen onNavigate={navigate} dispatch={dispatch} />;
      case 'contactDetail':
        return <NewContactDetailScreen contactId={screen.contactId} onBack={goBack} onNavigate={navigate} dispatch={dispatch} />;
      case 'addContact':
        return <FullAddContactScreen onBack={goBack} onSave={() => navigate({ name: 'contacts' })} />;
      case 'editContact':
        return <FullAddContactScreen contactId={screen.contactId} onBack={goBack} onSave={goBack} />;
      case 'quickCapture':
        return <QuickCaptureScreen onBack={goBack} onComplete={() => navigate({ name: 'home' })} />;
      case 'reminders':
        return <NewRemindersScreen onNavigate={navigate} dispatch={dispatch} />;
      case 'addReminder':
        return <NewAddReminderScreen contactId={screen.contactId} onBack={goBack} onSave={() => navigate({ name: 'reminders' })} />;
      case 'profile':
        return <NewProfileScreen onNavigate={navigate} />;
      default:
        return <NewHomeScreen onNavigate={navigate} dispatch={dispatch} />;
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
