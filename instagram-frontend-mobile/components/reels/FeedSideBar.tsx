import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PostResponse } from '../../types/post.type';

interface FeedSideBarProps {
  data: PostResponse;
  isLiked: boolean;
  onLike: () => void;
  onLikeCountPress?: () => void;
  onCommentPress?: () => void;
}

const IconWithText = ({
  iconName,
  count,
  color = 'white',
  onPress,
  onCountPress,
}: {
  iconName: any;
  count: number;
  color?: string;
  onPress?: () => void;
  onCountPress?: () => void;
}) => (
  <View style={styles.iconContainer}>
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={iconName} size={28} color={color} />
    </TouchableOpacity>
    <TouchableOpacity
      onPress={onCountPress}
      activeOpacity={0.7}
      style={styles.countButton}
    >
      <Text style={styles.countText}>{count}</Text>
    </TouchableOpacity>
  </View>
);

const FeedSideBar = ({ data, isLiked, onLike, onLikeCountPress, onCommentPress }: FeedSideBarProps) => {
  const { totalLike, totalComment } = data;

  return (
    <View style={styles.container}>
      <IconWithText
        iconName={isLiked ? 'heart' : 'heart-outline'}
        count={totalLike}
        color={isLiked ? '#ff3040' : 'white'}
        onPress={onLike}
        onCountPress={onLikeCountPress}
      />
      <IconWithText
        iconName="chatbubble-outline"
        count={totalComment}
        onPress={onCommentPress}
        onCountPress={onCommentPress}
      />
      <IconWithText iconName="share-social-outline" count={0} />
    </View>
  );
};

export default FeedSideBar;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'flex-end',
    alignItems: 'center',
    gap: 10,
    right: 20,
    zIndex: 10,
  },
  iconContainer: {
    alignItems: 'center',
  },
  countButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 2,
  },
  countText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  thumbnailContainer: {
    borderWidth: 3,
    borderColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbnail: {
    width: 24,
    height: 24,
    borderRadius: 8,
  },
});
