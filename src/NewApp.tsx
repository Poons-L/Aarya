import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
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

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const { reminders } = useReminders();
  const location = useLocation();
  const navigate = useNavigate();

  const overdueCount = reminders.filter(
    r => !r.completed && new Date(r.due_date) < new Date()
  ).length;

  // Determine active tab from current route
  const getActiveTab = (): Tab => {
    const path = location.pathname;
    if (path.startsWith('/contacts')) return 'contacts';
    if (path.startsWith('/reminders')) return 'reminders';
    if (path.startsWith('/profile')) return 'profile';
    return 'home';
  };

  const activeTab = getActiveTab();

  // Determine if bottom nav should be shown
  const showBottomNav = user && (
    location.pathname === '/home' ||
    location.pathname === '/contacts' ||
    location.pathname.startsWith('/contacts/') ||
    location.pathname === '/reminders' ||
    location.pathname === '/profile'
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500">
        <div className="text-white text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  const handleTabChange = (tab: Tab) => {
    navigate(`/${tab}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center">
      <div className="w-full max-w-[430px] min-h-screen bg-white shadow-xl flex flex-col">
        <div className="flex-1 overflow-hidden">
          <Routes>
            {/* Public routes */}
            <Route path="/welcome" element={<WelcomeScreen onGetStarted={() => navigate('/onboarding')} />} />
            <Route path="/onboarding" element={<OnboardingScreen onComplete={() => navigate('/auth')} />} />
            <Route path="/auth" element={<AuthScreen onBack={() => navigate('/welcome')} onAuth={() => navigate('/home')} />} />

            {/* Protected routes */}
            <Route path="/home" element={user ? <NewHomeScreen /> : <Navigate to="/welcome" replace />} />
            <Route path="/contacts" element={user ? <NewContactsScreen /> : <Navigate to="/welcome" replace />} />
            <Route path="/contacts/:id" element={user ? <NewContactDetailScreen /> : <Navigate to="/welcome" replace />} />
            <Route path="/contacts/add" element={user ? <FullAddContactScreen /> : <Navigate to="/welcome" replace />} />
            <Route path="/contacts/:id/edit" element={user ? <FullAddContactScreen /> : <Navigate to="/welcome" replace />} />
            <Route path="/quick-capture" element={user ? <QuickCaptureScreen /> : <Navigate to="/welcome" replace />} />
            <Route path="/reminders" element={user ? <NewRemindersScreen /> : <Navigate to="/welcome" replace />} />
            <Route path="/reminders/add" element={user ? <NewAddReminderScreen /> : <Navigate to="/welcome" replace />} />
            <Route path="/reminders/add/:contactId" element={user ? <NewAddReminderScreen /> : <Navigate to="/welcome" replace />} />
            <Route path="/profile" element={user ? <NewProfileScreen /> : <Navigate to="/welcome" replace />} />

            {/* Default redirect */}
            <Route path="/" element={user ? <Navigate to="/home" replace /> : <Navigate to="/welcome" replace />} />
            <Route path="*" element={user ? <Navigate to="/home" replace /> : <Navigate to="/welcome" replace />} />
          </Routes>
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

function NewApp() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default NewApp;
