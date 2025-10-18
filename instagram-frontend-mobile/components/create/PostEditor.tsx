import React, { useState } from 'react';
import {
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@hooks/useTheme';
import { MediaAsset } from '@services/media';
import { CaptionInput } from './CaptionInput';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PostEditorProps {
  media: MediaAsset[];
  onBack: () => void;
  onPublish: (caption: string) => void;
}

export const PostEditor: React.FC<PostEditorProps> = ({ media, onBack, onPublish }) => {
  const { theme } = useTheme();
  const [caption, setCaption] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await onPublish(caption);
    } catch (error) {
      console.error('Error publishing post:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        
        <Text style={[styles.title, { color: theme.colors.text }]}>New Post</Text>
        
        <TouchableOpacity onPress={handlePublish} disabled={isPublishing}>
          <Text style={[styles.publishButton, { color: theme.colors.primary }]}>
            {isPublishing ? 'Publishing...' : 'Publish'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.mediaContainer}
        >
          {media.map((item, index) => (
            <Image
              key={index}
              source={{ uri: item.uri }}
              style={styles.mediaImage}
              resizeMode="cover"
            />
          ))}
        </ScrollView>

        <CaptionInput value={caption} onChangeText={setCaption} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  publishButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  mediaContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
  mediaImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
});

