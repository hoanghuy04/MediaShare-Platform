import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  StatusBar,
  SafeAreaView,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useDebounce } from '../../hooks/useDebounce';
import { userAPI, aiAPI } from '../../services/api';
import { showAlert } from '../../utils/helpers';
import { Avatar } from '../../components/common/Avatar';
import { UserProfile } from '../../types';
import { storage } from '../../services/storage';

const RECENT_SEARCHES_KEY = 'message_recent_searches';

export default function MessageSearchScreen() {
  const { theme } = useTheme();
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const searchInputRef = useRef<TextInput>(null);
  const isSendingToAI = useRef(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<UserProfile[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<UserProfile[]>([]);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isEditingRecent, setIsEditingRecent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    loadRecentSearches();
    loadSuggestedUsers();
  }, []);

  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      performSearch(debouncedSearchQuery);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [debouncedSearchQuery]);

  const loadRecentSearches = async () => {
    try {
      const recent = await storage.getItem(RECENT_SEARCHES_KEY);
      if (recent && typeof recent === 'string') {
        setRecentSearches(JSON.parse(recent));
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  const saveRecentSearches = async (searches: UserProfile[]) => {
    try {
      await storage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
    } catch (error) {
      console.error('Error saving recent searches:', error);
    }
  };

  const loadSuggestedUsers = async () => {
    if (!currentUser?.id) return;
    
    setIsLoading(true);
    try {
      const following = await userAPI.getFollowing(currentUser.id, 0, 50);
      if (following) {
        setSuggestedUsers(following);
      }
    } catch (error) {
      console.error('Error loading suggested users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const performSearch = async (query: string) => {
    if (!currentUser?.id) return;
    
    setIsSearching(true);
    try {
      const following = await userAPI.getFollowing(currentUser.id, 0, 100);
      if (following) {
        const filtered = following.filter(user => 
          user.username.toLowerCase().includes(query.toLowerCase()) ||
          user.profile?.firstName?.toLowerCase().includes(query.toLowerCase()) ||
          user.profile?.lastName?.toLowerCase().includes(query.toLowerCase())
        );
        setSearchResults(filtered);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      showAlert('Lỗi', 'Không thể tìm kiếm người dùng');
    } finally {
      setIsSearching(false);
    }
  };

  const handleUserPress = async (user: UserProfile) => {
    // Add to recent searches
    const updatedRecent = [user, ...recentSearches.filter(u => u.id !== user.id)].slice(0, 10);
    setRecentSearches(updatedRecent);
    await saveRecentSearches(updatedRecent);
    
    // Navigate to conversation
    router.push(`/messages/${user.id}`);
  };

  const handleRemoveRecent = async (userToRemove: UserProfile) => {
    const updatedRecent = recentSearches.filter(user => user.id !== userToRemove.id);
    setRecentSearches(updatedRecent);
    await saveRecentSearches(updatedRecent);
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      performSearch(searchQuery.trim());
    }
    Keyboard.dismiss();
  };

  // Send message to AI assistant
  const handleSendToAI = useCallback(async () => {
    
    const prompt = searchQuery.trim();
    console.log('=== handleSendToAI called with prompt:', prompt);
    
    
    try {
      Keyboard.dismiss();
      
      const conversation = await aiAPI.getConversation();
      
      if (!conversation?.id) {
        showAlert('Lỗi', 'Không thể tạo cuộc trò chuyện với AI');
        isSendingToAI.current = false;
        return;
      }
      
      router.push({
        pathname: `/messages/${conversation.id}` as any,
        params: { textPrompt: prompt }
      });
      
    } catch (error: any) {
      console.error('Error opening AI conversation:', error);
      showAlert('Lỗi', error?.message || 'Không thể mở cuộc trò chuyện AI');
    } finally {
      // Reset flag after navigation
      setTimeout(() => {
        isSendingToAI.current = false;
      }, 500);
    }
  }, [searchQuery, router]);

  const getFilteredSuggestedUsers = () => {
    const recentUserIds = recentSearches.map(user => user.id);
    return suggestedUsers.filter(user => !recentUserIds.includes(user.id));
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
      </TouchableOpacity>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <View style={styles.aiIcon}>
            <Ionicons name="sparkles" size={16} color="white" />
          </View>
          <TextInput
            ref={searchInputRef}
            placeholderTextColor={theme.colors.textSecondary}
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Hỏi AI hoặc tìm kiếm"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            autoFocus
          />
        </View>
      </View>
      <TouchableOpacity 
        style={styles.sendButton} 
        onPress={handleSendToAI}
        activeOpacity={0.7}
      >
        <Ionicons name="paper-plane" size={20} color="#1677FF" />
      </TouchableOpacity>
    </View>
  );

  const renderUserItem = ({ item }: { item: UserProfile }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleUserPress(item)}
    >
      <Avatar uri={item.profile?.avatar} name={item.username} size={50} />
      <View style={styles.userInfo}>
        <Text style={[styles.username, { color: theme.colors.text }]}>
          {item.username}
        </Text>
        {(item.profile?.firstName || item.profile?.lastName) && (
          <Text style={[styles.fullName, { color: theme.colors.textSecondary }]}>
            {[item.profile?.firstName, item.profile?.lastName].filter(Boolean).join(' ')}
          </Text>
        )}
      </View>
      {isEditingRecent && recentSearches.some(u => u.id === item.id) && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveRecent(item)}
        >
          <Ionicons name="close-circle" size={24} color="#ff4444" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const renderRecentSearches = () => {
    if (recentSearches.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Mới đây
          </Text>
          <TouchableOpacity
            onPress={() => setIsEditingRecent(!isEditingRecent)}
          >
            <Text style={[styles.editButton, { color: theme.colors.primary }]}>
              {isEditingRecent ? 'Xong' : 'Chỉnh sửa'}
            </Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={recentSearches}
          renderItem={renderUserItem}
          keyExtractor={(item) => `recent-${item.id}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        />
      </View>
    );
  };

  const renderSuggestions = () => {
    const filteredUsers = getFilteredSuggestedUsers();
    if (filteredUsers.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Gợi ý khác
        </Text>
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => `suggestion-${item.id}`}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  };

  const renderSearchResults = () => {
    if (!searchQuery.trim()) return null;

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Kết quả tìm kiếm
        </Text>
        {searchResults.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              Không tìm thấy người dùng nào
            </Text>
          </View>
        ) : (
          <FlatList
            data={searchResults}
            renderItem={renderUserItem}
            keyExtractor={(item) => `search-${item.id}`}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    );
  };

  const renderContent = () => {
    if (searchQuery.trim()) {
      return renderSearchResults();
    }

    return (
      <>
        {renderRecentSearches()}
        {renderSuggestions()}
      </>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <SafeAreaView style={styles.safeArea}>
        {renderHeader()}
        <View style={styles.content}>
          {renderContent()}
        </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  searchContainer: {
    flex: 1,
  },
  sendButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
  },
  aiIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  searchInput: {
    fontSize: 16,
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  editButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  horizontalList: {
    paddingRight: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginRight: 16,
    minWidth: 200,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  fullName: {
    fontSize: 14,
  },
  removeButton: {
    padding: 4,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});