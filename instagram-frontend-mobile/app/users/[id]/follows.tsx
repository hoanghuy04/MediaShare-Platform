import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/context/AuthContext';
import { userService } from '@/services/user.service';
import { FollowerUserResponse, SimpleUserResponse } from '@/types/user';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { API_ENDPOINTS } from '@/config/routes';
import { FollowerItem } from '@/components/follows/FollowerItem';
import { FollowingItem } from '@/components/follows/FollowingItem';
import { RemoveFollowerModal } from '@/components/follows/RemoveFollowerModal';
import { SortModal, SortOption } from '@/components/follows/SortModal';

type TabType = 'followers' | 'following';

export default function FollowsScreen() {
  const { id, initialTab } = useLocalSearchParams<{ id: string; initialTab?: TabType }>();
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>((initialTab as TabType) || 'followers');
  const [searchQuery, setSearchQuery] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [showSortModal, setShowSortModal] = useState(false);

  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedFollower, setSelectedFollower] = useState<FollowerUserResponse | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (id) {
      userService.getUserById(id).then(setUserProfile).catch(console.error);
    }
  }, [id]);

  const followersScroll = useInfiniteScroll<FollowerUserResponse>({
    fetchFunc: async (page, limit) => {
      const response = await userService.searchFollowers(id, searchQuery, page, limit);
      return {
        content: response.content,
        totalPages: response.totalPages,
        totalElements: response.totalElements,
        hasNext: !response.last,
      };
    },
    limit: 20,
  });

  // Following list
  const followingScroll = useInfiniteScroll<SimpleUserResponse>({
    fetchFunc: async (page, limit) => {
      const sortDir = sortOption === 'newest' ? 'DESC' : 'ASC';
      const response = await userService.searchFollowing(id, searchQuery, page, limit, sortDir);
      return {
        content: response.content,
        totalPages: response.totalPages,
        totalElements: response.totalElements,
        hasNext: !response.last,
      };
    },
    limit: 20,
  });

  useFocusEffect(
    useCallback(() => {
      if (activeTab === 'followers') {
        followersScroll.refresh();
      } else {
        followingScroll.refresh();
      }
    }, [activeTab, id, searchQuery, sortOption])
  );

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchQuery('');
  };

  const handleFollowToggle = async (userId: string) => {
    try {
      if (activeTab === 'followers') {
        followersScroll.refresh();
      } else {
        followingScroll.refresh();
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const handleRemovePress = (follower: FollowerUserResponse) => {
    setSelectedFollower(follower);
    setShowRemoveModal(true);
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setToastVisible(false));
      }, 2000);
    });
  };

  const confirmRemoveFollower = async () => {
    if (!selectedFollower) return;

    try {
      await userService.removeFollower(selectedFollower.id);

      followersScroll.removeItem(selectedFollower.id);

      setUserProfile((prev: any) => ({
        ...prev,
        followersCount: Math.max(0, (prev?.followersCount || 0) - 1),
      }));

      setShowRemoveModal(false);
      showToast('Đã xóa người theo dõi');
    } catch (error) {
      console.error('Error removing follower:', error);
      showToast('Có lỗi xảy ra, vui lòng thử lại');
    }
  };

  const handleSortSelect = (option: SortOption) => {
    setSortOption(option);
    setShowSortModal(false);
  };

  const renderFollowerItem = ({ item }: { item: FollowerUserResponse }) => (
    <FollowerItem
      item={item}
      currentUserId={user?.id}
      profileId={id}
      theme={theme}
      onFollowToggle={handleFollowToggle}
      onRemove={handleRemovePress}
    />
  );

  const renderFollowingItem = ({ item }: { item: SimpleUserResponse }) => (
    <FollowingItem item={item} currentUserId={user?.id} theme={theme} />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: userProfile?.username || 'Đang tải...',
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.text,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 10 }}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={[styles.tabsContainer, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'followers' && styles.activeTab]}
          onPress={() => handleTabChange('followers')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'followers' && styles.activeTabText,
              { color: activeTab === 'followers' ? theme.colors.text : theme.colors.gray },
            ]}
          >
            {userProfile?.followersCount || 0} người theo dõi
          </Text>
          {activeTab === 'followers' && (
            <View style={[styles.tabIndicator, { backgroundColor: theme.colors.text }]} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'following' && styles.activeTab]}
          onPress={() => handleTabChange('following')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'following' && styles.activeTabText,
              { color: activeTab === 'following' ? theme.colors.text : theme.colors.gray },
            ]}
          >
            {userProfile?.followingCount || 0} đang theo dõi
          </Text>
          {activeTab === 'following' && (
            <View style={[styles.tabIndicator, { backgroundColor: theme.colors.text }]} />
          )}
        </TouchableOpacity>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: theme.colors.inputBackground }]}>
        <Ionicons name="search" size={20} color={theme.colors.gray} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Tìm kiếm"
          placeholderTextColor={theme.colors.gray}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {activeTab === 'following' && (
        <View style={styles.sortContainer}>
          <TouchableOpacity style={styles.sortButton} onPress={() => setShowSortModal(true)}>
            <Text style={[styles.sortText, { color: theme.colors.text }]}>
              {sortOption === 'newest' ? 'Mới nhất' : 'Ngày cũ nhất'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'followers' ? (
        <FlatList
          data={followersScroll.data}
          renderItem={renderFollowerItem}
          keyExtractor={item => item.id}
          onEndReached={followersScroll.loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            followersScroll.loading ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            !followersScroll.loading ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.colors.gray }]}>
                  Chưa có người theo dõi
                </Text>
              </View>
            ) : null
          }
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <FlatList
          data={followingScroll.data}
          renderItem={renderFollowingItem}
          keyExtractor={item => item.id}
          onEndReached={followingScroll.loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            followingScroll.loading ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            !followingScroll.loading ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.colors.gray }]}>
                  Chưa theo dõi ai
                </Text>
              </View>
            ) : null
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      <SortModal
        visible={showSortModal}
        sortOption={sortOption}
        theme={theme}
        onClose={() => setShowSortModal(false)}
        onSelect={handleSortSelect}
      />

      <RemoveFollowerModal
        visible={showRemoveModal}
        follower={selectedFollower}
        theme={theme}
        onClose={() => setShowRemoveModal(false)}
        onConfirm={confirmRemoveFollower}
      />

      {toastVisible && (
        <Animated.View style={[styles.toastContainer, { opacity: fadeAnim }]}>
          <View style={styles.toastContent}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {},
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    margin: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  sortContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sortText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  toastContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  toastContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  toastText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
