import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useAuth } from './hooks/useAuth';
import Layout from './components/common/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';
import LoginPage from './pages/LoginPage';
import AppointmentsPage from './pages/AppointmentsPage';
import AppointmentDetailPage from './pages/AppointmentDetailPage';
import AdminPage from './pages/AdminPage';
import NewAppointmentPage from './pages/NewAppointmentPage';
import CollaborativeCursors from './components/collaboration/CollaborativeCursor';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({
  children,
  adminOnly = false,
}) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to='/login' replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to='/appointments' replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, loadUser } = useAuth();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <div className='min-h-screen bg-gray-50'>
        {/* Global collaborative cursors */}
        {isAuthenticated && <CollaborativeCursors appointmentId='global' isEnabled={true} />}

        <Routes>
          <Route path='/login' element={isAuthenticated ? <Navigate to='/appointments' replace /> : <LoginPage />} />

          <Route
            path='/appointments'
            element={
              <ProtectedRoute>
                <Layout>
                  <AppointmentsPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path='/appointments/new'
            element={
              <ProtectedRoute>
                <Layout>
                  <NewAppointmentPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path='/appointments/:id'
            element={
              <ProtectedRoute>
                <Layout>
                  <AppointmentDetailPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path='/admin'
            element={
              <ProtectedRoute adminOnly>
                <Layout>
                  <AdminPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route path='/' element={<Navigate to={isAuthenticated ? '/appointments' : '/login'} replace />} />

          <Route path='*' element={<Navigate to='/' replace />} />
        </Routes>
      </div>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppContent />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
