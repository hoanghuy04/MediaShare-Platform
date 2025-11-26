import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { notificationApiService } from '../services/notification-api.service';
import { useWebSocket } from './WebSocketContext';
import { useAuth } from '../hooks/useAuth';
import { NotificationType } from '../types/notification';

interface UnreadCounts {
    total: number;
    byType: Record<string, number>;
}

interface NotificationContextType {
    unreadCount: number;
    unreadByType: Record<string, number>;
    incrementUnread: (type: NotificationType) => void;
    decrementUnread: (type: NotificationType) => void;
    refreshUnreadCount: () => Promise<void>;
    markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [unreadByType, setUnreadByType] = useState<Record<string, number>>({});
    const { onNotification } = useWebSocket();
    const { user } = useAuth();

    // Fetch initial unread count when user logs in
    const refreshUnreadCount = async () => {
        if (!user) {
            setUnreadCount(0);
            setUnreadByType({});
            return;
        }

        try {
            const counts = await notificationApiService.getUnreadCount();
            setUnreadCount(counts.total);
            setUnreadByType(counts.byType);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    // Initial fetch
    useEffect(() => {
        if (user) {
            refreshUnreadCount();
        } else {
            setUnreadCount(0);
            setUnreadByType({});
        }
    }, [user]);

    // Listen to real-time notifications and increment count
    const processedNotificationIds = React.useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!user) return;

        const unsubscribe = onNotification((notification) => {
            if (processedNotificationIds.current.has(notification.id)) {
                return;
            }

            processedNotificationIds.current.add(notification.id);
            // Cleanup old IDs to prevent memory leak
            setTimeout(() => {
                processedNotificationIds.current.delete(notification.id);
            }, 5000);

            if (!notification.read) {
                // Increment total
                setUnreadCount(prev => prev + 1);

                // Increment by type
                const typeKey = notification.type;
                setUnreadByType(prev => ({
                    ...prev,
                    [typeKey]: (prev[typeKey] || 0) + 1
                }));
            }
        });

        return () => unsubscribe();
    }, [onNotification, user]);

    const incrementUnread = (type: NotificationType) => {
        setUnreadCount(prev => prev + 1);
        setUnreadByType(prev => ({
            ...prev,
            [type]: (prev[type] || 0) + 1
        }));
    };

    const decrementUnread = (type: NotificationType) => {
        setUnreadCount(prev => Math.max(0, prev - 1));
        setUnreadByType(prev => ({
            ...prev,
            [type]: Math.max(0, (prev[type] || 0) - 1)
        }));
    };

    const markAllAsRead = async () => {
        try {
            // Optimistic update
            setUnreadCount(0);
            setUnreadByType({});

            await notificationApiService.markAllAsRead();
        } catch (error) {
            console.error('Error marking all as read:', error);
            // Revert if failed (optional, but good practice would be to re-fetch)
            refreshUnreadCount();
        }
    };

    return (
        <NotificationContext.Provider value={{
            unreadCount,
            unreadByType,
            incrementUnread,
            decrementUnread,
            refreshUnreadCount,
            markAllAsRead
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotificationContext = (): NotificationContextType => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotificationContext must be used within a NotificationProvider');
    }
    return context;
};
