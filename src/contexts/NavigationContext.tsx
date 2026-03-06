import { createContext, useContext, useState, ReactNode } from 'react';

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

interface NavigationContextType {
  currentScreen: Screen;
  history: Screen[];
  navigate: (screen: Screen) => void;
  goBack: () => void;
  viewContact: (contactId: string) => void;
  editContact: (contactId: string) => void;
  addReminder: (contactId?: string) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [currentScreen, setCurrentScreen] = useState<Screen>({ name: 'welcome' });
  const [history, setHistory] = useState<Screen[]>([]);

  const navigate = (screen: Screen) => {
    console.log('Navigate called:', screen);
    setHistory(prev => [...prev, currentScreen]);
    setCurrentScreen(screen);
  };

  const goBack = () => {
    console.log('GoBack called, history length:', history.length);
    if (history.length === 0) return;
    const newHistory = [...history];
    const previousScreen = newHistory.pop()!;
    setHistory(newHistory);
    setCurrentScreen(previousScreen);
  };

  const viewContact = (contactId: string) => {
    console.log('ViewContact called:', contactId);
    setHistory(prev => [...prev, currentScreen]);
    setCurrentScreen({ name: 'contactDetail', contactId });
  };

  const editContact = (contactId: string) => {
    console.log('EditContact called:', contactId);
    setHistory(prev => [...prev, currentScreen]);
    setCurrentScreen({ name: 'editContact', contactId });
  };

  const addReminder = (contactId?: string) => {
    console.log('AddReminder called:', contactId);
    setHistory(prev => [...prev, currentScreen]);
    setCurrentScreen({ name: 'addReminder', contactId });
  };

  return (
    <NavigationContext.Provider
      value={{
        currentScreen,
        history,
        navigate,
        goBack,
        viewContact,
        editContact,
        addReminder,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
}
