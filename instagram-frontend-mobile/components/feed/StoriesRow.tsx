import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@hooks/useTheme';
import { Avatar } from '../common/Avatar';

interface Story {
  id: string;
  username: string;
  avatar?: string;
  hasStory: boolean;
}

interface StoriesRowProps {
  stories?: Story[];
  onStoryPress?: (storyId: string) => void;
  onAddStoryPress?: () => void;
}

export const StoriesRow: React.FC<StoriesRowProps> = ({
  stories = [],
  onStoryPress,
  onAddStoryPress,
}) => {
  const { theme } = useTheme();

  const renderYourStory = () => (
    <TouchableOpacity 
      style={styles.storyItem} 
      onPress={onAddStoryPress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <View style={styles.yourStoryContainer}>
        <View style={[styles.avatarContainer, { borderColor: theme.colors.border }]}>
          <Avatar uri={undefined} name="Your Story" size={72} />
          <View style={[styles.addBadge, { backgroundColor: theme.colors.primary }]}>
            <Ionicons name="add" size={20} color="white" />
          </View>
        </View>
      </View>
      <Text style={[styles.username, { color: theme.colors.text }]} numberOfLines={1}>
        Tin của bạn
      </Text>
    </TouchableOpacity>
  );

  const renderStoryItem = (story: Story) => (
    <TouchableOpacity
      key={story.id}
      style={styles.storyItem}
      onPress={() => onStoryPress?.(story.id)}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <View style={styles.storyContainer}>
        {story.hasStory ? (
          <LinearGradient
            colors={['#FEDA75', '#FA7E1E', '#D62976', '#962FBF', '#4F5BD5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientRing}
          >
            <View style={[styles.innerRing, { backgroundColor: theme.colors.background }]}>
              <Avatar uri={story.avatar} name={story.username} size={68} />
            </View>
          </LinearGradient>
        ) : (
          <View style={[styles.avatarContainer, { borderColor: theme.colors.border }]}>
            <Avatar uri={story.avatar} name={story.username} size={72} />
          </View>
        )}
      </View>
      <Text style={[styles.username, { color: theme.colors.text }]} numberOfLines={1}>
        {story.username}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { borderBottomColor: theme.colors.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderYourStory()}
        {stories.map(renderStoryItem)}
      </ScrollView>
    </View>
  );
};

const STORY_SIZE = 72;

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  scrollContent: {
    paddingHorizontal: 8,
    gap: 12,
  },
  storyItem: {
    alignItems: 'center',
    width: STORY_SIZE + 8,
  },
  storyContainer: {
    marginBottom: 4,
  },
  yourStoryContainer: {
    marginBottom: 4,
  },
  avatarContainer: {
    width: STORY_SIZE,
    height: STORY_SIZE,
    borderRadius: STORY_SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientRing: {
    width: STORY_SIZE + 6,
    height: STORY_SIZE + 6,
    borderRadius: (STORY_SIZE + 6) / 2,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerRing: {
    width: STORY_SIZE + 2,
    height: STORY_SIZE + 2,
    borderRadius: (STORY_SIZE + 2) / 2,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  username: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
});

