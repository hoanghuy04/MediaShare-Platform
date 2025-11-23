import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface TypingIndicatorProps {
  isVisible: boolean;
  username?: string;
  multipleUsers?: string[];
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ 
  isVisible, 
  username, 
  multipleUsers = [] 
}) => {
  const { theme } = useTheme();
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (isVisible) {
      const animateDots = () => {
        const createAnimation = (dot: Animated.Value, delay: number) => {
          return Animated.loop(
            Animated.sequence([
              Animated.delay(delay),
              Animated.timing(dot, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.timing(dot, {
                toValue: 0.3,
                duration: 300,
                useNativeDriver: true,
              }),
            ])
          );
        };

        Animated.parallel([
          createAnimation(dot1, 0),
          createAnimation(dot2, 150),
          createAnimation(dot3, 300),
        ]).start();
      };

      animateDots();
    } else {
      // Reset dots when not visible
      dot1.setValue(0.3);
      dot2.setValue(0.3);
      dot3.setValue(0.3);
    }
  }, [isVisible, dot1, dot2, dot3]);

  if (!isVisible) return null;

  const getTypingText = () => {
    if (multipleUsers.length > 0) {
      if (multipleUsers.length === 1) {
        return `${multipleUsers[0]} đang nhập…`;
      } else if (multipleUsers.length === 2) {
        return `${multipleUsers[0]} và ${multipleUsers[1]} đang nhập…`;
      } else {
        return `${multipleUsers[0]}, ${multipleUsers[1]} và ${multipleUsers.length - 2} người khác đang nhập…`;
      }
    }
    return username ? `${username} đang nhập…` : 'Ai đó đang nhập…';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.content}>
        <View style={styles.dotsContainer}>
          <Animated.View 
            style={[
              styles.dot, 
              { 
                backgroundColor: theme.colors.textSecondary,
                opacity: dot1 
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.dot, 
              { 
                backgroundColor: theme.colors.textSecondary,
                opacity: dot2 
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.dot, 
              { 
                backgroundColor: theme.colors.textSecondary,
                opacity: dot3 
              }
            ]} 
          />
        </View>
        <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
          {getTypingText()}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxWidth: '75%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },
  text: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});
