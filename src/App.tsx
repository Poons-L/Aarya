import { useState, useEffect } from 'react';
import { MobileFrame } from './components/MobileFrame';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { AuthScreen } from './screens/AuthScreen';
import { HomeScreen } from './screens/HomeScreen';
import { AddContactScreen } from './screens/AddContactScreen';
import { ContactsScreen } from './screens/ContactsScreen';
import { ContactDetailScreen } from './screens/ContactDetailScreen';
import { RecordConversationScreen } from './screens/RecordConversationScreen';
import { AddMemoryScreen } from './screens/AddMemoryScreen';
import { SearchScreen } from './screens/SearchScreen';
import { RemindersScreen } from './screens/RemindersScreen';
import { AddReminderScreen } from './screens/AddReminderScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { MemoryDetailScreen } from './screens/MemoryDetailScreen';
import { useAuth } from './contexts/AuthContext';
import { useContacts } from './hooks/useContacts';
import { useReminders } from './hooks/useReminders';
import { useMemories } from './hooks/useMemories';

type Screen =
  | 'welcome'
  | 'onboarding'
  | 'auth'
  | 'home'
  | 'add-contact'
  | 'contacts'
  | 'contact-detail'
  | 'record-conversation'
  | 'add-memory'
  | 'memory-detail'
  | 'search'
  | 'reminders'
  | 'add-reminder'
  | 'settings';

function App() {
  const { user, loading: authLoading } = useAuth();
  const { contacts } = useContacts();
  const { reminders } = useReminders();
  const { memories } = useMemories();
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        setCurrentScreen('home');
      } else {
        setCurrentScreen('welcome');
      }
    }
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <MobileFrame>
        <div className="h-full flex items-center justify-center bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500">
          <div className="text-white text-xl font-semibold">Loading...</div>
        </div>
      </MobileFrame>
    );
  }

  const selectedContact = contacts.find(c => c.id === selectedContactId);
  const selectedMemory = memories.find(m => m.id === selectedMemoryId);

  const mockContacts = [
    {
      id: '1',
      name: 'Sarah Johnson',
      company: 'TechVentures Inc.',
      title: 'Senior Product Manager',
      email: 'sarah.j@techventures.com',
      phone: '+1 (555) 234-5678',
      tags: ['investor', 'product'],
      met_at: 'SaaS Conference 2025',
      met_date: '2025-01-15',
      notes: 'Interested in our AI features',
      created_at: '2025-01-15',
    },
    {
      id: '2',
      name: 'Michael Chen',
      company: 'Global Innovations',
      title: 'VP of Engineering',
      email: 'mchen@globalinnovations.com',
      tags: ['tech', 'partner'],
      met_at: 'Developer Meetup',
      met_date: '2025-01-18',
      created_at: '2025-01-18',
    },
    {
      id: '3',
      name: 'Emma Davis',
      company: 'Startup Labs',
      title: 'Founder & CEO',
      email: 'emma@startuplabs.io',
      tags: ['entrepreneur', 'mentor'],
      met_at: 'Y Combinator Event',
      met_date: '2025-01-22',
      created_at: '2025-01-22',
    },
    {
      id: '4',
      name: 'Alex Rodriguez',
      company: 'Design Studio Pro',
      title: 'Creative Director',
      email: 'alex@designstudio.com',
      tags: ['design', 'client'],
      met_at: 'Design Conference',
      met_date: '2025-01-25',
      created_at: '2025-01-25',
    },
    {
      id: '5',
      name: 'Jennifer Lee',
      company: 'Marketing Masters',
      title: 'CMO',
      email: 'jlee@marketingmasters.com',
      tags: ['marketing', 'consultant'],
      met_at: 'Marketing Summit',
      met_date: '2025-01-28',
      created_at: '2025-01-28',
    },
  ];

  const navigate = (screen: Screen) => {
    setCurrentScreen(screen);
  };

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
          <HomeScreen
            onNavigate={navigate}
            onSelectMemory={(memoryId) => {
              setSelectedMemoryId(memoryId);
              navigate('memory-detail');
            }}
            onSelectContact={(contactId) => {
              setSelectedContactId(contactId);
              navigate('contact-detail');
            }}
            contacts={contacts}
            reminders={reminders}
            memories={memories}
          />
        );

      case 'add-contact':
        return (
          <AddContactScreen
            onBack={() => navigate('home')}
            onSave={() => navigate('home')}
            onHome={() => navigate('home')}
          />
        );

      case 'contacts':
        return (
          <ContactsScreen
            onBack={() => navigate('home')}
            onNavigate={navigate}
            onSelectContact={(contactId) => {
              setSelectedContactId(contactId);
              navigate('contact-detail');
            }}
            contacts={contacts}
          />
        );

      case 'contact-detail':
        if (!selectedContact) {
          navigate('contacts');
          return null;
        }
        return (
          <ContactDetailScreen
            contact={selectedContact}
            onBack={() => navigate('contacts')}
            onEdit={() => navigate('add-contact')}
            onAddReminder={() => navigate('add-reminder')}
            onHome={() => navigate('home')}
          />
        );

      case 'record-conversation':
        return (
          <RecordConversationScreen
            onBack={() => navigate('home')}
            onSave={() => navigate('home')}
            onHome={() => navigate('home')}
            onCreateContact={() => navigate('add-contact')}
            contacts={contacts}
          />
        );

      case 'add-memory':
        return (
          <AddMemoryScreen
            onBack={() => navigate('home')}
            onSave={() => navigate('home')}
            onHome={() => navigate('home')}
            contacts={contacts}
          />
        );

      case 'memory-detail':
        if (!selectedMemory) {
          navigate('home');
          return null;
        }
        return (
          <MemoryDetailScreen
            memory={selectedMemory}
            contacts={contacts}
            onBack={() => navigate('home')}
            onHome={() => navigate('home')}
            onDelete={() => navigate('home')}
          />
        );

      case 'search':
        return (
          <SearchScreen
            onNavigate={navigate}
            onSelectMemory={(memoryId) => {
              setSelectedMemoryId(memoryId);
              navigate('memory-detail');
            }}
            onSelectContact={(contactId) => {
              setSelectedContactId(contactId);
              navigate('contact-detail');
            }}
            contacts={contacts}
          />
        );

      case 'reminders':
        return (
          <RemindersScreen
            onBack={() => navigate('home')}
            onAddReminder={() => navigate('add-reminder')}
            onNavigate={navigate}
          />
        );

      case 'add-reminder':
        return (
          <AddReminderScreen
            onBack={() => navigate('reminders')}
            onSave={() => navigate('reminders')}
            onHome={() => navigate('home')}
          />
        );

      case 'settings':
        return (
          <SettingsScreen
            onBack={() => navigate('home')}
            onNavigate={navigate}
          />
        );

      default:
        return <WelcomeScreen onGetStarted={() => navigate('auth')} />;
    }
  };

  return (
    <MobileFrame>
      {renderScreen()}
    </MobileFrame>
  );
}

export default App;
