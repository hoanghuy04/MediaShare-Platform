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
const ITEM_SIZE = (SCREEN_WIDTH - 4) / 3;

interface ProfileGridSkeletonProps {
  itemCount?: number;
}

export const ProfileGridSkeleton: React.FC<ProfileGridSkeletonProps> = ({ itemCount = 9 }) => {
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

  const items = Array.from({ length: itemCount }, (_, i) => i);
  const rows: number[][] = [];
  
  for (let i = 0; i < items.length; i += 3) {
    rows.push(items.slice(i, i + 3));
  }

  return (
    <View style={styles.container}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((item) => (
            <Animated.View
              key={item}
              style={[
                styles.gridItem,
                { backgroundColor: theme.colors.skeleton },
                animatedStyle,
              ]}
            />
          ))}
          {/* Fill empty cells to maintain grid alignment */}
          {row.length < 3 && Array.from({ length: 3 - row.length }).map((_, i) => (
            <View key={`empty-${i}`} style={styles.gridItem} />
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 2,
  },
  gridItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 2,
  },
});
