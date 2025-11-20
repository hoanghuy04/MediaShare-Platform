import { StyleSheet, Text, View, Image, Platform } from 'react-native';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { PostResponse } from '../../types/post.type';

interface FeedSideBarProps {
  data: PostResponse;
}

const IconWithText = ({ iconName, count }: { iconName: any; count: number }) => (
  <View style={styles.iconContainer}>
    <Ionicons name={iconName} size={28} color="white" />
    <Text style={styles.countText}>{count}</Text>
  </View>
);

const FeedSideBar = ({ data }: FeedSideBarProps) => {
  const { likesCount, commentsCount } = data;

  return (
    <View style={styles.container}>
      <IconWithText iconName="heart-outline" count={likesCount} />
      <IconWithText iconName="chatbubble-outline" count={commentsCount} />
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
