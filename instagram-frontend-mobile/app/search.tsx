import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  TextInput,
  Dimensions,
  Image,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { useDebounce } from '../hooks/useDebounce';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { userAPI } from '../services/api';
import { postService } from '../services/post.service';
import { showAlert } from '../utils/helpers';
import { UserProfile, Post } from '../types';
import { Avatar } from '../components/common/Avatar';
import { storage } from '../services/storage';

const { width: screenWidth } = Dimensions.get('window');
const itemSize = (screenWidth - 4) / 3;

type SearchTab = 'for_you' | 'accounts' | 'reels';

export default function SearchScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { query: initialQuery } = useLocalSearchParams<{ query?: string }>();

  const [searchQuery, setSearchQuery] = useState(initialQuery || '');
  const [activeTab, setActiveTab] = useState<SearchTab>('for_you');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [filteredRecentSearches, setFilteredRecentSearches] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [apiUnavailable, setApiUnavailable] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    users: UserProfile[];
    posts: Post[];
    reels: Post[];
  }>({
    users: [],
    posts: [],
    reels: [],
  });

  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches();
  }, []);

  // Filter recent searches when query changes
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const filtered = recentSearches.filter(search =>
        search.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRecentSearches(filtered);
    } else {
      setFilteredRecentSearches(recentSearches);
    }
  }, [searchQuery, recentSearches]);

  const loadRecentSearches = async () => {
    try {
      const recent = await storage.getRecentSearches();
      setRecentSearches(recent || []);
      setFilteredRecentSearches(recent || []);
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  const saveRecentSearch = async (query: string) => {
    try {
      const recent = await storage.getRecentSearches() || [];
      const updated = [query, ...recent.filter(item => item !== query)].slice(0, 10);
      await storage.setRecentSearches(updated);
      setRecentSearches(updated);
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  };

  const removeRecentSearch = async (query: string) => {
    try {
      const recent = await storage.getRecentSearches() || [];
      const updated = recent.filter(item => item !== query);
      await storage.setRecentSearches(updated);
      setRecentSearches(updated);
    } catch (error) {
      console.error('Error removing recent search:', error);
    }
  };

  const performSearch = async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      // Search users (this endpoint exists)
      const usersResponse = await userAPI.searchUsers(query, 0, 5);

      // Search posts (with fallback)
      const postsResponse = await postService.searchPosts(query, 0, 20);

      // Search reels (with fallback)
      const reelsResponse = await postService.searchReels(query, 0, 20);

      setSearchResults({
        users: usersResponse.content || [],
        posts: postsResponse.content || [],
        reels: reelsResponse.content || [],
      });

      // Save to recent searches
      await saveRecentSearch(query);
    } catch (error: any) {
      console.error('Search error:', error);

      // Show user-friendly error message
      if (error.response?.status === 404) {
        setApiUnavailable(true);

        // Fallback to explore content
        try {
          const exploreResponse = await postService.getExplorePosts(0, 20);
          setSearchResults({
            users: [],
            posts: exploreResponse.content || [],
            reels: exploreResponse.content?.filter(post =>
              post.media.some(media => media.type === 'VIDEO' || media.type === 'video')
            ) || [],
          });
        } catch (fallbackError) {
          console.error('Fallback error:', fallbackError);
          showAlert('Lỗi', 'Không thể tải nội dung. Vui lòng thử lại sau.');
        }
      } else {
        showAlert('Lỗi', 'Có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại sau.');
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      performSearch(searchQuery.trim());
      Keyboard.dismiss();
    }
  };

  const handleRecentSearchPress = (query: string) => {
    setSearchQuery(query);
    performSearch(query);
    Keyboard.dismiss();
  };

  const handleUserPress = (userId: string) => {
    router.push(`/users/${userId}`);
  };

  const handlePostPress = (postId: string) => {
    router.push(`/posts/${postId}`);
  };

  const renderRecentSearches = () => (
    <View style={styles.recentContainer}>
      <View style={styles.recentHeader}>
        <Text style={[styles.recentTitle, { color: theme.colors.text }]}>Mới đây</Text>
        <TouchableOpacity onPress={() => storage.clearRecentSearches()}>
          <Text style={[styles.clearAll, { color: theme.colors.primary }]}>Xem tất cả</Text>
        </TouchableOpacity>
      </View>
      {filteredRecentSearches.map((search, index) => (
        <TouchableOpacity
          key={index}
          style={styles.recentItem}
          onPress={() => handleRecentSearchPress(search)}
        >
          <Ionicons name="time-outline" size={20} color={theme.colors.textSecondary} />
          <Text style={[styles.recentText, { color: theme.colors.text }]}>{search}</Text>
          <TouchableOpacity onPress={() => removeRecentSearch(search)}>
            <Ionicons name="close" size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      {[
        { key: 'for_you', label: 'Dành cho bạn' },
        { key: 'accounts', label: 'Tài khoản' },
        { key: 'reels', label: 'Reels' },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tab,
            activeTab === tab.key && styles.activeTab,
          ]}
          onPress={() => setActiveTab(tab.key as SearchTab)}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === tab.key ? theme.colors.text : theme.colors.textSecondary },
            ]}
          >
            {tab.label}
          </Text>
          {activeTab === tab.key && <View style={[styles.tabIndicator, { backgroundColor: theme.colors.text }]} />}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderForYouContent = () => {
    if (isSearching) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    // Combine all data for a single FlatList
    const combinedData = [
      ...(searchResults.users.length > 0 ? [{ type: 'section', title: 'Tài khoản', data: searchResults.users.slice(0, 5) }] : []),
      ...(searchResults.posts.length > 0 ? [{ type: 'section', title: 'Bài viết', data: searchResults.posts }] : []),
    ];

    if (combinedData.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            Không tìm thấy kết quả nào
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={combinedData}
        renderItem={({ item }) => {
          if (item.type === 'section') {
            return (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{item.title}</Text>
                {item.title === 'Tài khoản' ? (
                  // Render users
                  item.data.map((user: any) => (
                    <TouchableOpacity
                      key={user.id}
                      style={[styles.userItem, { backgroundColor: theme.colors.background }]}
                      onPress={() => handleUserPress(user.id)}
                    >
                      <Avatar uri={user.profile?.avatar} name={user.username} size={48} />
                      <View style={styles.userInfo}>
                        <Text style={[styles.username, { color: theme.colors.text }]}>{user.username}</Text>
                        <Text style={[styles.fullName, { color: theme.colors.textSecondary }]}>
                          {user.profile?.firstName} {user.profile?.lastName}
                        </Text>
                      </View>
                      {user.isVerified && <Text style={styles.verified}>✓</Text>}
                    </TouchableOpacity>
                  ))
                ) : (
                  // Render posts grid
                  <View style={styles.postsGrid}>
                    {item.data.map((post: any, index: number) => (
                      <TouchableOpacity
                        key={post.id}
                        style={[styles.gridItem, { width: itemSize, height: itemSize }]}
                        onPress={() => handlePostPress(post.id)}
                      >
                        <Image
                          source={{ uri: post.media[0]?.url }}
                          style={styles.gridImage}
                          resizeMode="cover"
                        />
                        {post.media.length > 1 && (
                          <View style={styles.multipleIndicator}>
                            <Ionicons name="albums" size={16} color="white" />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            );
          }
          return null;
        }}
        keyExtractor={(item, index) => `${item.type}-${index}`}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  const renderAccountsContent = () => {
    if (isSearching) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    if (searchResults.users.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            Không tìm thấy tài khoản nào
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={searchResults.users}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.userItem, { backgroundColor: theme.colors.background }]}
            onPress={() => handleUserPress(item.id)}
          >
            <Avatar uri={item.profile?.avatar} name={item.username} size={56} />
            <View style={styles.userInfo}>
              <Text style={[styles.username, { color: theme.colors.text }]}>{item.username}</Text>
              <Text style={[styles.fullName, { color: theme.colors.textSecondary }]}>
                {item.profile?.firstName} {item.profile?.lastName}
              </Text>
            </View>
            {item.isVerified && <Text style={styles.verified}>✓</Text>}
          </TouchableOpacity>
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  const renderReelsContent = () => {
    if (isSearching) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    if (searchResults.reels.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            Không tìm thấy Reels nào
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={searchResults.reels}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.gridItem, { width: itemSize, height: itemSize }]}
            onPress={() => handlePostPress(item.id)}
          >
            <Image
              source={{ uri: item.media[0]?.url }}
              style={styles.gridImage}
              resizeMode="cover"
            />
            <View style={styles.videoIndicator}>
              <Ionicons name="play" size={16} color="white" />
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={item => item.id}
        numColumns={3}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  const renderContent = () => {
    // Show recent searches if no search query or haven't searched yet
    if (!searchQuery.trim() || !hasSearched) {
      return renderRecentSearches();
    }

    // Show development notice if API is unavailable
    if (apiUnavailable) {
      return (
        <View style={styles.contentContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            Tìm kiếm đang phát triển
          </Text>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            Chức năng tìm kiếm chi tiết đang được phát triển. Hiện tại hiển thị nội dung khám phá thay thế.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.contentContainer}>
        {renderTabBar()}
        <View style={styles.tabContent}>
          {activeTab === 'for_you' && renderForYouContent()}
          {activeTab === 'accounts' && renderAccountsContent()}
          {activeTab === 'reels' && renderReelsContent()}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
      ]}
      // nếu có bottom tab mà bị dư padding dưới thì bật dòng này:
      // edges={['top', 'left', 'right']}
    >
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header với ô search */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#8e8e8e" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm"
            placeholderTextColor="#8e8e8e"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            onBlur={() => Keyboard.dismiss()}
            autoFocus
            returnKeyType="search"
          />
        </View>
      </View>

      {/* Phần nội dung phải flex:1 */}
      <View style={{ flex: 1 }}>
        {renderContent()}
      </View>
    </SafeAreaView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  backButton: {
    marginRight: 12,
  },
  searchBar: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: '#f4f4f5',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 0,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  recentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  clearAll: {
    fontSize: 14,
    fontWeight: '500',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  recentText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  contentContainer: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    position: 'relative',
  },
  activeTab: {
    // Active tab styling
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  tabContent: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  section: {
    marginBottom: 24,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 16,
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
  listContainer: {
    paddingVertical: 8,
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
