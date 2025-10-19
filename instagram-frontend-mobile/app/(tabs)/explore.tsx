import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@hooks/useTheme';
import { useDebounce } from '@hooks/useDebounce';
import { useInfiniteScroll } from '@hooks/useInfiniteScroll';
import { Header } from '@components/common/Header';
import { SearchBar } from '@components/explore/SearchBar';
import { ExploreGrid } from '@components/explore/ExploreGrid';
import { Avatar } from '@components/common/Avatar';
import { postAPI, userAPI } from '@services/api';
import { showAlert } from '@utils/helpers';
import { UserProfile } from '@types';

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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header title="Explore" />
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search users, posts..."
        onClear={handleClearSearch}
      />
      {searchQuery.trim().length > 0 ? (
        renderSearchResults()
      ) : (
        <ExploreGrid posts={posts} onEndReached={loadMore} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
