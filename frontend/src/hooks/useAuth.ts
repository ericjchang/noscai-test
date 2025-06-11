import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const { user, token, isLoading, error, login, logout, loadUser, clearError } = useAuthStore();

  useEffect(() => {
    if (token && !user) {
      loadUser();
    }
  }, [token, user, loadUser]);

  const isAuthenticated = !!user && !!token;
  const isAdmin = user?.role === 'admin';

  return {
    user,
    token,
    isLoading,
    error,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    loadUser,
    clearError,
  };
};
