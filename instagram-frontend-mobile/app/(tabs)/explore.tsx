import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
  TextInput,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@hooks/useTheme';
import { useDebounce } from '@hooks/useDebounce';
import { useInfiniteScroll } from '@hooks/useInfiniteScroll';
import { postAPI, userAPI } from '@services/api';
import { showAlert } from '@utils/helpers';
import { UserProfile, Post } from '@types';
import { Avatar } from '@components/common/Avatar';

const { width: screenWidth } = Dimensions.get('window');
const itemSize = (screenWidth - 4) / 3; // 3 columns with 2px gaps

export default function ExploreScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 500);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const {
    data: posts,
    isLoading,
    hasMore,
    loadMore,
    refresh,
  } = useInfiniteScroll({
    fetchFunc: postAPI.getExplorePosts,
    limit: 30,
    onError: error => showAlert('Error', error.message),
  });

  useEffect(() => {
    refresh();
  }, []);

  // Search users when query changes
  useEffect(() => {
    const searchUsers = async () => {
      if (debouncedQuery.trim().length > 0) {
        setIsSearching(true);
        try {
          const response = await userAPI.searchUsers(debouncedQuery);
          setSearchResults(response.content);
        } catch (error: any) {
          console.error('Search error:', error);
          showAlert('Error', error.message);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    };

    searchUsers();
  }, [debouncedQuery]);

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleUserPress = (userId: string) => {
    router.push(`/users/${userId}`);
  };

  const renderUserItem = ({ item }: { item: UserProfile }) => {
    const fullName =
      item.profile?.firstName && item.profile?.lastName
        ? `${item.profile.firstName} ${item.profile.lastName}`
        : item.username;

    return (
      <TouchableOpacity
        style={[styles.userItem, { backgroundColor: theme.colors.background }]}
        onPress={() => handleUserPress(item.id)}
      >
        <Avatar uri={item.profile?.avatar} name={item.username} size={48} />
        <View style={styles.userInfo}>
          <Text style={[styles.username, { color: theme.colors.text }]}>{item.username}</Text>
          <Text style={[styles.fullName, { color: theme.colors.textSecondary }]}>{fullName}</Text>
        </View>
        {item.isVerified && <Text style={styles.verified}>✓</Text>}
      </TouchableOpacity>
    );
  };

  const renderSearchResults = () => {
    if (isSearching) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    if (searchResults.length === 0 && debouncedQuery.trim().length > 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            No users found for "{debouncedQuery}"
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={searchResults}
        renderItem={renderUserItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
      />
    );
  };

  const renderGridItem = ({ item, index }: { item: Post; index: number }) => {
    const firstMedia = item.media[0];
    const isVideo = firstMedia?.type === 'VIDEO' || firstMedia?.type === 'video';
    const hasMultipleMedia = item.media.length > 1;
    
    return (
      <TouchableOpacity
        style={[styles.gridItem, { width: itemSize, height: itemSize }]}
        onPress={() => router.push(`/posts/${item.id}`)}
      >
        <Image
          source={{ uri: firstMedia?.url }}
          style={styles.gridImage}
          resizeMode="cover"
        />
        
        {/* Video indicator */}
        {isVideo && (
          <View style={styles.videoIndicator}>
            <Ionicons name="play" size={16} color="white" />
          </View>
        )}
        
        {/* Multiple media indicator */}
        {hasMultipleMedia && (
          <View style={styles.multipleIndicator}>
            <Ionicons name="albums" size={16} color="white" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <SafeAreaView style={styles.safeArea}>
        {/* Top search bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#8e8e8e" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm"
              placeholderTextColor="#8e8e8e"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {searchQuery.trim().length > 0 ? (
          renderSearchResults()
        ) : (
          <FlatList
            data={posts}
            renderItem={renderGridItem}
            keyExtractor={item => item.id}
            numColumns={3}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.gridContainer}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  safeArea: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  gridContainer: {
    paddingTop: 8,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  gridItem: {
    backgroundColor: '#f0f0f0',
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  videoIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 4,
  },
  multipleIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 4,
  },
  listContainer: {
    paddingVertical: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
  },
  fullName: {
    fontSize: 14,
    marginTop: 2,
  },
  verified: {
    fontSize: 16,
    color: '#1DA1F2',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
