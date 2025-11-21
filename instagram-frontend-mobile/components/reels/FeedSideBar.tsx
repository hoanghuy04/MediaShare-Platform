import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { PostResponse } from '../../types/post.type';

interface FeedSideBarProps {
  data: PostResponse;
  isLiked: boolean;
  onLike: () => void;
}

const IconWithText = ({
  iconName,
  count,
  color = 'white',
  onPress,
}: {
  iconName: any;
  count: number;
  color?: string;
  onPress?: () => void;
}) => (
  <TouchableOpacity onPress={onPress} style={styles.iconContainer} activeOpacity={0.7}>
    <Ionicons name={iconName} size={28} color={color} />
    <Text style={styles.countText}>{count}</Text>
  </TouchableOpacity>
);

const FeedSideBar = ({ data, isLiked, onLike }: FeedSideBarProps) => {
  const { totalLike: initialLikes, totalComment } = data;
  const [totalLike, setTotalLike] = useState(initialLikes);

  React.useEffect(() => {
    setTotalLike(prev => (isLiked ? initialLikes + 1 : initialLikes));
  }, [isLiked, initialLikes]);

  return (
    <View style={styles.container}>
      <IconWithText
        iconName={isLiked ? 'heart' : 'heart-outline'}
        count={totalLike}
        color={isLiked ? '#ff3040' : 'white'}
        onPress={onLike}
      />
      <IconWithText iconName="chatbubble-outline" count={totalComment} />
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
    gap: 20,
    right: 20,
    zIndex: 10,
  },
  iconContainer: {
    alignItems: 'center',
  },
  countText: {
    color: '#fff',
    marginTop: 10,
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
