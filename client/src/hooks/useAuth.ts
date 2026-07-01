import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api.service';
import { useAuthStore } from '../store/authStore';
import { connectSocket, disconnectSocket } from '../lib/socket';
import { useEffect } from 'react';

export function useAuth() {
  const { user, accessToken, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // On mount, try to refresh access token using the httpOnly cookie
  useEffect(() => {
    if (isAuthenticated && !accessToken) {
      authApi
        .refresh()
        .then(({ data }) => {
          useAuthStore.getState().setAccessToken(data.data.accessToken);
          connectSocket(data.data.accessToken);
        })
        .catch(() => {
          clearAuth();
        });
    } else if (isAuthenticated && accessToken) {
      connectSocket(accessToken);
    }
  }, []);

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: ({ data }) => {
      setAuth(data.data.user, data.data.accessToken);
      connectSocket(data.data.accessToken);
      toast.success(`Welcome to SkillSwap, ${data.data.user.name}! 🎉`);
      navigate('/dashboard');
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? 'Registration failed';
      toast.error(msg);
    },
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ data }) => {
      setAuth(data.data.user, data.data.accessToken);
      connectSocket(data.data.accessToken);
      toast.success(`Welcome back, ${data.data.user.name}!`);
      navigate('/dashboard');
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? 'Login failed';
      toast.error(msg);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      clearAuth();
      disconnectSocket();
      queryClient.clear();
      navigate('/login');
      toast.success('Logged out');
    },
  });

  return {
    user,
    accessToken,
    isAuthenticated,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: () => logoutMutation.mutate(),
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
  };
}
