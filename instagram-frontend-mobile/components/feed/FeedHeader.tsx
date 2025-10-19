import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@hooks/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FeedHeaderProps {
  onActivityPress?: () => void;
  onMessagesPress?: () => void;
  hasNotifications?: boolean;
}

export const FeedHeader: React.FC<FeedHeaderProps> = ({
  onActivityPress,
  onMessagesPress,
  hasNotifications = false,
}) => {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
          <Text style={[styles.logoText, { color: theme.colors.text }]}>Instagram</Text>

          {/* Right Icons */}
          <View style={styles.rightIcons}>
            {/* Activity/Notifications Icon */}
            <TouchableOpacity
              onPress={onActivityPress}
              style={styles.iconButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={hasNotifications ? 'heart' : 'heart-outline'}
                size={26}
                color={hasNotifications ? theme.colors.like : theme.colors.text}
              />
              {hasNotifications && <View style={styles.notificationDot} />}
            </TouchableOpacity>

            {/* Messages Icon */}
            <TouchableOpacity
              onPress={onMessagesPress || (() => router.push('/(tabs)/messages'))}
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
  },
  notificationDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    borderWidth: 1,
    borderColor: 'white',
  },
});

