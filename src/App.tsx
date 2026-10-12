import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './features/auth/AuthProvider';
import { SnackbarProvider } from './context/SnackbarContext';
import { TextSizeProvider } from './context/TextSizeContext';
import { AppShell } from './components/layout/AppShell';
import { HomePage } from './features/home/HomePage';
import { HistoryPage } from './features/history/HistoryPage';
import { MenuPage } from './features/menu/MenuPage';
import { InvitePage } from './features/auth/InvitePage';
import { WelcomePage } from './features/auth/WelcomePage';
import { LogoutPage } from './features/auth/LogoutPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { member, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <p className="text-lg text-[var(--text)]">Loading...</p>
      </div>
    );
  }

  if (!member) {
    return <Navigate to="/welcome" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/welcome" element={<WelcomePage />} />
      <Route path="/invite" element={<InvitePage />} />

      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/menu" element={<MenuPage />} />
      </Route>

      {/* Logout */}
      <Route
        path="/logout"
        element={
          <ProtectedRoute>
            <LogoutPage />
          </ProtectedRoute>
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <TextSizeProvider>
        <AuthProvider>
          <SnackbarProvider>
            <AppRoutes />
          </SnackbarProvider>
        </AuthProvider>
      </TextSizeProvider>
    </BrowserRouter>
  );
}
