import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { authAPI } from '../services/api';
import { userService } from '../services/user.service';
import { secureStorage, storage } from '../services/storage';
import { User, LoginRequest, RegisterRequest } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    console.log('Auth navigation check:', { user: !!user, inAuthGroup, segments });

    if (!user && !inAuthGroup) {
      // Redirect to login if not authenticated
      console.log('Redirecting to login...');
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // Redirect to main app if authenticated
      console.log('Redirecting to feed...');
      router.replace('/(tabs)/feed');
    }
  }, [user, segments, isLoading]);

  const loadUser = async () => {
    try {
      const storedToken = await secureStorage.getToken();
      if (storedToken) {
        setToken(storedToken);
        const userData = await storage.getUserData<User>();
        if (userData) {
          console.log('User loaded from storage:', userData.username);
          setUser(userData);
        } else {
          // If token exists but no user data, clear token and redirect to login
          console.log('Token exists but no user data, clearing...');
          await secureStorage.removeToken();
          setToken(null);
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
      await secureStorage.removeToken();
      await storage.removeUserData();
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await authAPI.login(credentials);

      // Validate token before storing
      if (!response.accessToken || typeof response.accessToken !== 'string') {
        throw new Error('Invalid token received from server');
      }

      await secureStorage.setToken(response.accessToken);
      await storage.setUserData(response.user);
      setToken(response.accessToken);
      setUser(response.user);

      // Force navigation to feed after successful login
      console.log('Login successful, navigating to feed...');
      router.replace('/(tabs)/feed');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      const response = await authAPI.register(data);

      // Validate token before storing
      if (!response.accessToken || typeof response.accessToken !== 'string') {
        throw new Error('Invalid token received from server');
      }

      await secureStorage.setToken(response.accessToken);
      await storage.setUserData(response.user);
      setToken(response.accessToken);
      setUser(response.user);

      // Force navigation to feed after successful registration
      console.log('Registration successful, navigating to feed...');
      router.replace('/(tabs)/feed');
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await secureStorage.removeToken();
      await storage.removeUserData();
      setToken(null);
      setUser(null);
      router.replace('/(auth)/login');
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    storage.setUserData(updatedUser);
  };

  const refreshUserData = async () => {
    if (!user?.id) return;

    try {
      const freshUserData = await userService.getUserById(user.id);
      setUser(freshUserData as unknown as User);
      await storage.setUserData(freshUserData as unknown as User);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
