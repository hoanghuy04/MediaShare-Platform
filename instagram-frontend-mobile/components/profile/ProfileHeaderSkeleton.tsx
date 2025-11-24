import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
  withSequence,
} from 'react-native-reanimated';
import { useTheme } from '@hooks/useTheme';

export const ProfileHeaderSkeleton: React.FC = () => {
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
    <View style={styles.container}>
      {/* Top Section */}
      <View style={styles.topSection}>
        {/* Avatar */}
        <Animated.View
          style={[
            styles.avatar,
            { backgroundColor: theme.colors.skeleton },
            animatedStyle,
          ]}
        />

        {/* Stats */}
        <View style={styles.stats}>
          {[1, 2, 3].map(i => (
            <View key={i} style={styles.statItem}>
              <Animated.View
                style={[
                  styles.statNumber,
                  { backgroundColor: theme.colors.skeleton },
                  animatedStyle,
                ]}
              />
              <Animated.View
                style={[
                  styles.statLabel,
                  { backgroundColor: theme.colors.skeleton },
                  animatedStyle,
                ]}
              />
            </View>
          ))}
        </View>
      </View>

      {/* Username & Bio */}
      <View style={styles.infoSection}>
        <Animated.View
          style={[
            styles.username,
            { backgroundColor: theme.colors.skeleton },
            animatedStyle,
          ]}
        />
        <Animated.View
          style={[
            styles.bioLine,
            { backgroundColor: theme.colors.skeleton, width: '90%' },
            animatedStyle,
          ]}
        />
        <Animated.View
          style={[
            styles.bioLine,
            { backgroundColor: theme.colors.skeleton, width: '70%' },
            animatedStyle,
          ]}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonsContainer}>
        <Animated.View
          style={[
            styles.button,
            { backgroundColor: theme.colors.skeleton },
            animatedStyle,
          ]}
        />
        <Animated.View
          style={[
            styles.button,
            { backgroundColor: theme.colors.skeleton },
            animatedStyle,
          ]}
        />
      </View>

      {/* Stories/Highlights */}
      <View style={styles.highlightsContainer}>
        {[1, 2, 3, 4].map(i => (
          <View key={i} style={styles.highlightItem}>
            <Animated.View
              style={[
                styles.highlightCircle,
                { backgroundColor: theme.colors.skeleton },
                animatedStyle,
              ]}
            />
            <Animated.View
              style={[
                styles.highlightLabel,
                { backgroundColor: theme.colors.skeleton },
                animatedStyle,
              ]}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
  },
  stats: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    width: 40,
    height: 16,
    borderRadius: 4,
    marginBottom: 4,
  },
  statLabel: {
    width: 50,
    height: 12,
    borderRadius: 4,
  },
  infoSection: {
    marginBottom: 16,
  },
  username: {
    width: 120,
    height: 16,
    borderRadius: 4,
    marginBottom: 8,
  },
  bioLine: {
    height: 12,
    borderRadius: 4,
    marginBottom: 4,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    height: 32,
    borderRadius: 6,
  },
  highlightsContainer: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 8,
  },
  highlightItem: {
    alignItems: 'center',
  },
  highlightCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 4,
  },
  highlightLabel: {
    width: 50,
    height: 10,
    borderRadius: 4,
  },
});
