import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
  withSequence,
} from 'react-native-reanimated';
import { useTheme } from '@hooks/useTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MEDIA_ASPECT_RATIO = 1;

export const PostCardSkeleton: React.FC = () => {
  const { theme } = useTheme();
  const opacity = useSharedValue(0.3);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0.3, { duration: 800 })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Animated.View
            style={[
              styles.avatar,
              { backgroundColor: theme.colors.skeleton },
              animatedStyle,
            ]}
          />
          <Animated.View
            style={[
              styles.username,
              { backgroundColor: theme.colors.skeleton },
              animatedStyle,
            ]}
          />
        </View>
        <Animated.View
          style={[
            styles.menuIcon,
            { backgroundColor: theme.colors.skeleton },
            animatedStyle,
          ]}
        />
      </View>

      {/* Media */}
      <Animated.View
        style={[
          styles.media,
          { backgroundColor: theme.colors.skeleton },
          animatedStyle,
        ]}
      />

      {/* Actions */}
      <View style={styles.actionsRow}>
        <View style={styles.leftActions}>
          {[1, 2, 3].map(i => (
            <Animated.View
              key={i}
              style={[
                styles.actionIcon,
                { backgroundColor: theme.colors.skeleton },
                animatedStyle,
              ]}
            />
          ))}
        </View>
        <Animated.View
          style={[
            styles.actionIcon,
            { backgroundColor: theme.colors.skeleton },
            animatedStyle,
          ]}
        />
      </View>

      {/* Likes Info */}
      <Animated.View
        style={[
          styles.likesInfo,
          { backgroundColor: theme.colors.skeleton },
          animatedStyle,
        ]}
      />

      {/* Caption */}
      <View style={styles.captionContainer}>
        <Animated.View
          style={[
            styles.captionLine,
            { backgroundColor: theme.colors.skeleton, width: '80%' },
            animatedStyle,
          ]}
        />
        <Animated.View
          style={[
            styles.captionLine,
            { backgroundColor: theme.colors.skeleton, width: '60%', marginTop: 6 },
            animatedStyle,
          ]}
        />
      </View>

      {/* Timestamp */}
      <Animated.View
        style={[
          styles.timestamp,
          { backgroundColor: theme.colors.skeleton },
          animatedStyle,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  username: {
    width: 100,
    height: 14,
    borderRadius: 4,
  },
  menuIcon: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  media: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * MEDIA_ASPECT_RATIO,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionIcon: {
    width: 24,
    height: 24,
    borderRadius: 4,
  },
  likesInfo: {
    marginHorizontal: 12,
    marginTop: 8,
    height: 14,
    width: 150,
    borderRadius: 4,
  },
  captionContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  captionLine: {
    height: 12,
    borderRadius: 4,
  },
  timestamp: {
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
    height: 10,
    width: 80,
    borderRadius: 4,
  },
});
