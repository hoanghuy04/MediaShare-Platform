import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { authAPI } from '@services/api';
import { secureStorage, storage } from '@services/storage';
import { User, LoginRequest, RegisterRequest } from '@types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
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
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // Redirect to main app if authenticated
      router.replace('/(tabs)/feed');
    }
  }, [user, segments, isLoading]);

  const loadUser = async () => {
    try {
      const token = await secureStorage.getToken();
      if (token) {
        const userData = await storage.getUserData<User>();
        if (userData) {
          setUser(userData);
        } else {
          // Fetch user data from API
          const fetchedUser = await authAPI.getMe();
          setUser(fetchedUser);
          await storage.setUserData(fetchedUser);
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
      await secureStorage.removeToken();
      await storage.removeUserData();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await authAPI.login(credentials);
      await secureStorage.setToken(response.token);
      await storage.setUserData(response.user);
      setUser(response.user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      const response = await authAPI.register(data);
      await secureStorage.setToken(response.token);
      await storage.setUserData(response.user);
      setUser(response.user);
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
      setUser(null);
      router.replace('/(auth)/login');
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    storage.setUserData(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

