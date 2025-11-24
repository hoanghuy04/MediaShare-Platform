import React from 'react';
import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

type Props = {
  visible: boolean;
  onPress: () => void;
  backgroundColor: string;
  iconColor: string;
};

export const ScrollToBottomButton: React.FC<Props> = ({
  visible,
  onPress,
  backgroundColor,
  iconColor,
}) => {
  const { theme } = useTheme();

  if (!visible) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[
        styles.scrollFab,
        { backgroundColor },
      ]}
      onPress={onPress}
    >
      <Ionicons
        name="chevron-down"
        size={22}
        color={iconColor}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  scrollFab: {
    position: 'absolute',
    right: '50%',
    transform: [{ translateX: 22 }],
    bottom: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 6 },
    }),
  },
});

