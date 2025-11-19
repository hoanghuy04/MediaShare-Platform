import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { notificationService } from '@services/notifications';
import * as Notifications from 'expo-notifications';
import { WebSocketProvider } from './WebSocketContext';

interface AppContextType {
  pushToken: string | null;
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  incrementUnreadCount: () => void;
  resetUnreadCount: () => void;
  isNetworkConnected: boolean;
  setNetworkConnected: (connected: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNetworkConnected, setNetworkConnected] = useState(true);

  useEffect(() => {
    registerForPushNotifications();
    setupNotificationListeners();
  }, []);

  const registerForPushNotifications = async () => {
    try {
      const token = await notificationService.registerForPushNotifications();
      setPushToken(token);
      if (token) {
        console.log('Push notifications registered successfully');
      }
    } catch (error: any) {
      console.log('Push notifications not available in development:', error?.message || 'Unknown error');
      // This is expected in Expo Go, so we just log it
    }
  };

  const setupNotificationListeners = () => {
    // Listen for notifications received while app is in foreground
    const receivedListener = notificationService.addNotificationReceivedListener(
      notification => {
        console.log('Notification received:', notification);
        incrementUnreadCount();
      }
    );

    // Listen for user interactions with notifications
    const responseListener = notificationService.addNotificationResponseReceivedListener(
      response => {
        console.log('Notification response:', response);
        // Handle notification tap - navigate to relevant screen
        const data = response.notification.request.content.data;
        // TODO: Add navigation logic based on notification data
      }
    );

    return () => {
      notificationService.removeNotificationSubscription(receivedListener);
      notificationService.removeNotificationSubscription(responseListener);
    };
  };

  const incrementUnreadCount = () => {
    setUnreadCount(prev => {
      const newCount = prev + 1;
      notificationService.setBadgeCount(newCount);
      return newCount;
    });
  };

  const resetUnreadCount = () => {
    setUnreadCount(0);
    notificationService.clearBadge();
  };

  return (
    <AppContext.Provider
      value={{
        pushToken,
        unreadCount,
        setUnreadCount,
        incrementUnreadCount,
        resetUnreadCount,
        isNetworkConnected,
        setNetworkConnected,
      }}
    >
      <WebSocketProvider>
        {children}
      </WebSocketProvider>
    </AppContext.Provider>
  );
};

