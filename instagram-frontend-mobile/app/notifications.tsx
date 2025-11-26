import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, SectionList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import NotificationItem from '../components/notifications/NotificationItem';
import { notificationApiService } from '../services/notification-api.service';
import { useWebSocket } from '../context/WebSocketContext';
import { NotificationMessage } from '../services/websocket';
import { NotificationResponse } from '../types/notification';
import { useNotificationContext } from '../context/NotificationContext';

interface Section {
    title: string;
    data: NotificationResponse[];
}

const NotificationScreen = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { onNotification } = useWebSocket();
    const { decrementUnread } = useNotificationContext();
    const [sections, setSections] = useState<Section[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    // Fetch notifications from API
    const fetchNotifications = useCallback(async (pageNum: number = 0, append: boolean = false) => {
        try {
            if (pageNum === 0) {
                setIsLoading(true);
            }

            const response = await notificationApiService.getNotifications(pageNum, 20);
            const notifications = response.content;

            // Group notifications by date
            const grouped = groupNotificationsByDate(notifications);

            if (append) {
                setSections(prev => mergeNotificationSections(prev, grouped));
            } else {
                setSections(grouped);
            }

            setHasMore(!response.last);
            setPage(pageNum);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    // Group notifications by date (Today, This Week, Older)
    const groupNotificationsByDate = (notifications: NotificationResponse[]): Section[] => {
        const now = new Date();
        const today: NotificationResponse[] = [];
        const thisWeek: NotificationResponse[] = [];
        const older: NotificationResponse[] = [];

        notifications.forEach(notif => {
            const createdAt = new Date(notif.createdAt);
            const diffTime = now.getTime() - createdAt.getTime();
            const diffDays = diffTime / (1000 * 3600 * 24);

            if (diffDays < 1) {
                today.push(notif);
            } else if (diffDays < 7) {
                thisWeek.push(notif);
            } else {
                older.push(notif);
            }
        });

        const result: Section[] = [];
        if (today.length > 0) result.push({ title: 'Hôm nay', data: today });
        if (thisWeek.length > 0) result.push({ title: '7 ngày qua', data: thisWeek });
        if (older.length > 0) result.push({ title: 'Cũ hơn', data: older });

        return result;
    };

    // Merge new sections with existing ones
    const mergeNotificationSections = (existing: Section[], newSections: Section[]): Section[] => {
        const sectionMap = new Map<string, NotificationResponse[]>();

        // Add existing notifications
        existing.forEach(section => {
            sectionMap.set(section.title, section.data);
        });

        // Merge new notifications
        newSections.forEach(section => {
            const existingData = sectionMap.get(section.title) || [];
            const merged = [...existingData, ...section.data];
            const unique = merged.filter((item, index, self) =>
                index === self.findIndex(t => t.id === item.id)
            );
            sectionMap.set(section.title, unique);
        });

        // Convert back to sections array
        const result: Section[] = [];
        ['Hôm nay', '7 ngày qua', 'Cũ hơn'].forEach(title => {
            const data = sectionMap.get(title);
            if (data && data.length > 0) {
                result.push({ title, data });
            }
        });

        return result;
    };

    // Handle real-time notifications
    useEffect(() => {
        const unsubscribe = onNotification((wsNotif: NotificationMessage) => {
            console.log('📥 Real-time notification received:', wsNotif);

            const notification = wsNotif as NotificationResponse;

            // Add to the beginning of "Today" section
            setSections(prevSections => {
                const newSections = [...prevSections];
                const todaySection = newSections.find(s => s.title === 'Hôm nay');

                if (todaySection) {
                    if (!todaySection.data.find(n => n.id === notification.id)) {
                        todaySection.data.unshift(notification);
                    }
                } else {
                    newSections.unshift({ title: 'Hôm nay', data: [notification] });
                }

                return newSections;
            });
        });

        return () => unsubscribe();
    }, [onNotification]);

    // Initial fetch
    useEffect(() => {
        fetchNotifications(0);
    }, [fetchNotifications]);

    const handleRefresh = useCallback(() => {
        setIsRefreshing(true);
        fetchNotifications(0);
    }, [fetchNotifications]);

    const handleLoadMore = useCallback(() => {
        if (!isLoading && hasMore) {
            fetchNotifications(page + 1, true);
        }
    }, [isLoading, hasMore, page, fetchNotifications]);

    const handlePressItem = useCallback((item: NotificationResponse) => {
        console.log('Click item:', item.id);

        // Mark as read
        if (!item.read) {
            notificationApiService.markAsRead(item.id).catch(console.error);
            decrementUnread(item.type); // Update context

            setSections(prevSections =>
                prevSections.map(section => ({
                    ...section,
                    data: section.data.map(notif =>
                        notif.id === item.id ? { ...notif, read: true } : notif
                    ),
                }))
            );
        }

        // Navigate based on notification type
        if (item.type === 'FOLLOW' && item.senderId) {
            router.push(`/users/${item.senderId}` as any);
        } else if (item.postId && (item.type === 'LIKE_POST' || item.type === 'COMMENT_POST')) {
            router.push(`/posts/${item.postId}` as any);
        }
    }, [router]);

    const renderFooter = () => {
        if (!hasMore) return null;
        return (
            <View style={styles.footer}>
                <ActivityIndicator size="small" color="#999" />
            </View>
        );
    };

    if (isLoading && sections.length === 0) {
        return (
            <View style={[styles.safeArea, { paddingTop: insets.top }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Thông báo</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0095f6" />
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.safeArea, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Thông báo</Text>
                <View style={{ width: 24 }} />
            </View>

            {sections.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="notifications-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyText}>Chưa có thông báo nào</Text>
                </View>
            ) : (
                <SectionList
                    sections={sections}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <NotificationItem
                            item={item}
                            onPress={handlePressItem}
                        />
                    )}
                    renderSectionHeader={({ section: { title } }) => (
                        <Text style={styles.sectionHeader}>{title}</Text>
                    )}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    stickySectionHeadersEnabled={false}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
                    }
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={renderFooter}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
        marginTop: 20,
        marginBottom: 10,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
    },
    footer: {
        paddingVertical: 20,
        alignItems: 'center',
    },
});

export default NotificationScreen;
