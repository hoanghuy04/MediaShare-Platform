import React from 'react';
import { View, FlatList, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Post } from '@types';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_SIZE = (SCREEN_WIDTH - 4) / 3;

interface PostGridProps {
  posts: Post[];
  onEndReached?: () => void;
}

export const PostGrid: React.FC<PostGridProps> = ({ posts = [], onEndReached }) => {
  const router = useRouter();

  const renderItem = ({ item }: { item: Post }) => (
    <TouchableOpacity style={styles.gridItem} onPress={() => router.push(`/posts/${item.id}`)}>
      <Image source={{ uri: item.media?.[0]?.url }} style={styles.image} resizeMode="cover" />
      {item.media && item.media.length > 1 && (
        <View style={styles.multipleIcon}>
          <Ionicons name="copy-outline" size={18} color="white" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={posts}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      numColumns={3}
      columnWrapperStyle={styles.row}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      showsVerticalScrollIndicator={false}
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
  multipleIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});
