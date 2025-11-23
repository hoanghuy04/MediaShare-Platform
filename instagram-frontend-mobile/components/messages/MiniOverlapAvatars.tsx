import React from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface AvatarItem {
  id: string;
  avatar?: string;
  username?: string;
}

interface MiniOverlapAvatarsProps {
  members: AvatarItem[];
  maxDisplay?: number;
  size?: number;
}

export const MiniOverlapAvatars: React.FC<MiniOverlapAvatarsProps> = ({
  members,
  maxDisplay = 4,
  size = 28,
}) => {
  const { theme } = useTheme();
  const visibleMembers = members.slice(0, maxDisplay);
  const extraCount = Math.max(members.length - maxDisplay, 0);

  return (
    <View style={styles.container}>
      {visibleMembers.map((member, index) => (
        <View
          key={member.id}
          style={[
            styles.avatarWrapper,
            {
              zIndex: visibleMembers.length - index,
              marginLeft: index === 0 ? 0 : -size / 3,
              width: size,
              height: size,
              borderRadius: size / 2,
              borderColor: theme.colors.background,
            },
          ]}
        >
          {member.avatar ? (
            <Image source={{ uri: member.avatar }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.fallback, { backgroundColor: theme.colors.surface }]}>
              <Text style={styles.fallbackText}>{member.username?.[0]?.toUpperCase() || '?'}</Text>
            </View>
          )}
        </View>
      ))}
      {extraCount > 0 && (
        <View
          style={[
            styles.extraBubble,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginLeft: -size / 3,
              zIndex: 0,
              borderColor: theme.colors.background,
            },
          ]}
        >
          <Text style={styles.extraText}>+{extraCount}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    borderWidth: 2,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    fontSize: 12,
    fontWeight: '600',
  },
  extraBubble: {
    borderWidth: 2,
    backgroundColor: '#d9d9d9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
});


