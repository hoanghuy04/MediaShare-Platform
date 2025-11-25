import React, { useState } from 'react';
import { FlatList, TouchableOpacity, Image, StyleSheet, Dimensions, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '@types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_SIZE = (SCREEN_WIDTH - 4) / 3;

interface ReelGridItemProps {
  item: Post;
  userId?: string;
  videoThumbnails: { [key: string]: string };
  onThumbnailGenerated: (itemId: string, uri: string) => void;
}

const ReelGridItem: React.FC<ReelGridItemProps> = ({ 
  item, 
  userId, 
  videoThumbnails, 
  onThumbnailGenerated 
}) => {
  const router = useRouter();
  const videoMedia = item.media?.find(m => m.category === 'VIDEO' || m.type === 'VIDEO' || m.type === 'video');
  const imageMedia = item.media?.find(m => m.category === 'IMAGE');
  const isVideo = !!videoMedia;
  
  // Use cached thumbnail, image thumbnail, or video URL
  const thumbnailUri = videoThumbnails[item.id] || imageMedia?.url || videoMedia?.url || item.media?.[0]?.url;

  // Generate thumbnail for video if not cached
  React.useEffect(() => {
    if (isVideo && videoMedia && !videoThumbnails[item.id] && !imageMedia) {
      VideoThumbnails.getThumbnailAsync(videoMedia.url, {
        time: 0,
      })
        .then(({ uri }) => {
          onThumbnailGenerated(item.id, uri);
        })
        .catch(error => {
          console.log('Error generating thumbnail for', item.id, error);
        });
    }
  }, [item.id, isVideo, videoMedia, imageMedia]);
  
  return (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() =>
        router.push({
          pathname: '/profile/reels',
          params: { userId, reelId: item.id },
        })
      }
    >
      <Image source={{ uri: thumbnailUri }} style={styles.image} resizeMode="cover" />
      {/* Video indicator */}
      {isVideo && (
        <View style={styles.videoIndicator}>
          <Ionicons name="play" size={16} color="white" />
        </View>
      )}
      {/* View count overlay */}
      <View style={styles.viewCountOverlay}>
        <Ionicons name="play" size={12} color="white" />
        <Text style={styles.viewCountText}>{item.totalLike || 0}</Text>
      </View>
    </TouchableOpacity>
  );
};

interface ReelGridProps {
  reels: Post[];
  userId?: string;
  onLoadMore: () => void;
  isLoading: boolean;
  emptyMessage?: string;
  ListEmptyComponent?: React.ReactNode;
}

export const ReelGrid: React.FC<ReelGridProps> = ({
  reels,
  userId,
  onLoadMore,
  isLoading,
  emptyMessage = 'Chưa có thước phim',
  ListEmptyComponent,
}) => {
  const [videoThumbnails, setVideoThumbnails] = useState<{ [key: string]: string }>({});

  const renderReelItem = ({ item }: { item: Post }) => (
    <ReelGridItem
      item={item}
      userId={userId}
      videoThumbnails={videoThumbnails}
      onThumbnailGenerated={(itemId, uri) => {
        setVideoThumbnails(prev => ({ ...prev, [itemId]: uri }));
      }}
    />
  );

  return (
    <FlatList
      data={reels}
      renderItem={renderReelItem}
      keyExtractor={item => item.id}
      numColumns={3}
      columnWrapperStyle={styles.row}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.5}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={ListEmptyComponent}
    />
  );
};

const styles = StyleSheet.create({
  row: {
    gap: 2,
  },
  gridItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    marginBottom: 2,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  videoIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  viewCountOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewCountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
