import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@hooks/useTheme';
import { getInitials, getRandomColor } from '@utils/helpers';

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: number;
  style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({ uri, name = '', size = 40, style }) => {
  const { theme } = useTheme();
  const initials = getInitials(name);
  const backgroundColor = uri ? 'transparent' : getRandomColor();

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
        style,
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={[styles.image, { borderRadius: size / 2 }]} />
      ) : (
        <Text
          style={[
            styles.initials,
            {
              fontSize: size * 0.4,
              color: theme.colors.white,
            },
          ]}
        >
          {initials}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initials: {
    fontWeight: '600',
  },
});

