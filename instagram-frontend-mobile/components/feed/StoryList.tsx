import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StoriesRow } from './StoriesRow';

interface Story {
  id: string;
  username: string;
  avatar?: string;
  hasStory: boolean;
}

interface StoryListProps {
  stories?: Story[];
  onStoryPress?: (storyId: string) => void;
  onAddStoryPress?: () => void;
}

export const StoryList: React.FC<StoryListProps> = ({
  stories = [],
  onStoryPress,
  onAddStoryPress,
}) => {
  return (
    <View style={styles.container}>
      <StoriesRow stories={stories} onStoryPress={onStoryPress} onAddStoryPress={onAddStoryPress} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
  },
});
