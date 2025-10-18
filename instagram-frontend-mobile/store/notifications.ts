import { create } from 'zustand';
import { Notification } from '@types';

interface NotificationsStore {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

export const useNotificationsStore = create<NotificationsStore>(set => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: notifications =>
    set({
      notifications,
      unreadCount: notifications.filter(n => !n.isRead).length,
    }),
  addNotification: notification =>
    set(state => ({
      notifications: [notification, ...state.notifications],
      unreadCount: notification.isRead ? state.unreadCount : state.unreadCount + 1,
    })),
  markAsRead: notificationId =>
    set(state => ({
      notifications: state.notifications.map(n =>
        n.id === notificationId ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
  markAllAsRead: () =>
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),
  clearNotifications: () =>
    set({
      notifications: [],
      unreadCount: 0,
    }),
}));

