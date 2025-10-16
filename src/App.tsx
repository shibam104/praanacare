import { useState, useEffect } from 'react';
import { OnboardingScreen } from './components/OnboardingScreen';
import { PatientDashboard } from './components/PatientDashboard';
import { AIChat } from './components/AIChat';
import { DoctorDashboard } from './components/DoctorDashboard';
import { EmployerDashboard } from './components/EmployerDashboard';
import { ThemeToggle } from './components/ThemeToggle';
import { AuthModal } from './components/AuthModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';

type Screen = 'onboarding' | 'patient' | 'chat' | 'doctor' | 'employer';
type UserRole = 'patient' | 'doctor' | 'employer' | null;

function AppContent() {
  const { user, isLoading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>('onboarding');
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    // Check for saved theme preference or default to light
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const handleRoleSelect = (role: UserRole) => {
    setUserRole(role);
    if (user && user.role === role) {
      // User is already authenticated and has the correct role
      switch (role) {
        case 'patient':
          setCurrentScreen('patient');
          break;
        case 'doctor':
          setCurrentScreen('doctor');
          break;
        case 'employer':
          setCurrentScreen('employer');
          break;
      }
    } else {
      // Show authentication modal
      setShowAuthModal(true);
    }
  };

  const handleNavigate = (screen: string) => {
    setCurrentScreen(screen as Screen);
  };

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
  };

  // Apply theme to document
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Handle authentication success
  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    if (userRole) {
      switch (userRole) {
        case 'patient':
          setCurrentScreen('patient');
          break;
        case 'doctor':
          setCurrentScreen('doctor');
          break;
        case 'employer':
          setCurrentScreen('employer');
          break;
      }
    }
  };

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading PraanaCare...</p>
        </div>
      </div>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'onboarding':
        return <OnboardingScreen onRoleSelect={handleRoleSelect} />;
      case 'patient':
        return <PatientDashboard onNavigate={handleNavigate} />;
      case 'chat':
        return <AIChat onNavigate={handleNavigate} />;
      case 'doctor':
        return <DoctorDashboard onNavigate={handleNavigate} />;
      case 'employer':
        return <EmployerDashboard onNavigate={handleNavigate} />;
      default:
        return <OnboardingScreen onRoleSelect={handleRoleSelect} />;
    }
  };

  return (
    <div className="size-full relative">
      {/* Theme Toggle - Fixed position */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
      </div>
      
      {renderScreen()}
      
      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}