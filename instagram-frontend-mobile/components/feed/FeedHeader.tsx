import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotificationContext } from '../../context/NotificationContext';
import { useWebSocket } from '../../context/WebSocketContext';

interface FeedHeaderProps {
  onActivityPress?: () => void;
  onMessagesPress?: () => void;
}

// Map notification types to Ionicons names
const NOTIFICATION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  LIKE_POST: 'heart',
  LIKE_COMMENT: 'heart',
  COMMENT_POST: 'chatbubble',
  FOLLOW: 'person',
  TAG_IN_COMMENT: 'at',
  TAG_IN_POST: 'at',
};

export const FeedHeader: React.FC<FeedHeaderProps> = ({
  onActivityPress,
  onMessagesPress,
}) => {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { onNotification } = useWebSocket();
  const { unreadCount, unreadByType, markAllAsRead } = useNotificationContext();
  const [showDetailedBadge, setShowDetailedBadge] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    const unsubscribe = onNotification(() => {
      setShowDetailedBadge(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setShowDetailedBadge(false);
      }, 5000);
    });
    return () => {
      unsubscribe();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [onNotification]);

  // Get types with counts > 0, sort by count desc
  const activeTypes = Object.entries(unreadByType)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3); // Show max 3 types

  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.background, paddingTop: insets.top },
        ]}
      >
        <View style={styles.content}>
          {/* Instagram Wordmark */}
          <Text style={[styles.logoText, { color: theme.colors.text }]}>Sudo</Text>

          {/* Right Icons */}
          <View style={styles.rightIcons}>
            {/* Activity/Notifications Icon */}
            <TouchableOpacity
              onPress={() => {
                if (onActivityPress) {
                  onActivityPress();
                } else {
                  router.push('/notifications' as any);
                }
              }}
              style={styles.iconButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="heart-outline"
                size={26}
                color={theme.colors.text}
              />

              {unreadCount > 0 && (
                showDetailedBadge && activeTypes.length > 0 ? (
                  <View style={styles.badgeContainer}>
                    {activeTypes.map(([type, count], index) => (
                      <View key={type} style={[
                        styles.badgeItem,
                        index > 0 && styles.badgeItemSeparator
                      ]}>
                        <Ionicons
                          name={NOTIFICATION_ICONS[type] || 'notifications'}
                          size={10}
                          color="#FFF"
                        />
                        <Text style={styles.badgeText}>
                          {count > 9 ? '9+' : count}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.simpleDot} />
                )
              )}
            </TouchableOpacity>

            {/* Messages Icon */}
            <TouchableOpacity
              onPress={onMessagesPress || (() => router.push('/messages'))}
              style={styles.iconButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="paper-plane-outline" size={26} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  content: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '600',
    fontFamily: 'System',
    letterSpacing: -0.5,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  iconButton: {
    position: 'relative',
    zIndex: 1,
  },
  simpleDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeContainer: {
    position: 'absolute',
    top: 14, // Offset from top
    left: 16, // Offset from left (creates the floating effect to the right of the heart)
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 2,
    borderColor: '#fff',
    minHeight: 22,
    gap: 6,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  badgeItemSeparator: {
    marginLeft: 2,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
    lineHeight: 14,
  },
});
