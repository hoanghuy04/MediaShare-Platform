import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@hooks/useTheme';
import { useDebounce } from '@hooks/useDebounce';
import { useInfiniteScroll } from '@hooks/useInfiniteScroll';
import { Header } from '@components/common/Header';
import { SearchBar } from '@components/explore/SearchBar';
import { ExploreGrid } from '@components/explore/ExploreGrid';
import { postAPI } from '@services/api';
import { showAlert } from '@utils/helpers';

export default function ExploreScreen() {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 500);

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

  const handleClearSearch = () => {
    setSearchQuery('');
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
      <ExploreGrid posts={posts} onEndReached={loadMore} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

