import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { userService } from '../../services/user.service';
import { SelectedChips, SelectedChipUser } from './SelectedChips';
import { UserRow, UserRowItem } from './UserRow';
import { showAlert } from '../../utils/helpers';

export interface MutualUserOption extends SelectedChipUser, UserRowItem {}

interface MutualUserPickerProps {
  currentUserId: string;
  selectedUsers: Record<string, MutualUserOption>;
  onSelectedChange: (next: Record<string, MutualUserOption>) => void;
  excludeUserIds?: string[];
  enableChips?: boolean;
  emptyMessage?: string;
}

const PAGE_SIZE = 20;

export const MutualUserPicker: React.FC<MutualUserPickerProps> = ({
  currentUserId,
  selectedUsers,
  onSelectedChange,
  excludeUserIds = [],
  enableChips = true,
  emptyMessage = 'Chỉ hiện những người theo dõi nhau',
}) => {
  const { theme } = useTheme();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [mutuals, setMutuals] = useState<MutualUserOption[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const excludeSet = useMemo(() => new Set([...excludeUserIds, currentUserId]), [excludeUserIds, currentUserId]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setPage(0);
    setHasMore(true);
    loadMutuals(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, currentUserId]);

  const buildDisplayName = (user: MutualUserOption): string => {
    if (user.displayName && user.displayName.trim().length > 0) return user.displayName;
    return user.username;
  };

  const normalizeResponse = (raw: any): MutualUserOption => {
    const displayName =
      raw.displayName ||
      raw.fullName ||
      (raw.profile?.firstName
        ? [raw.profile.firstName, raw.profile.lastName].filter(Boolean).join(' ')
        : raw.username);
    return {
      id: raw.id,
      username: raw.username,
      displayName,
      avatar: raw.avatar ?? raw.profile?.avatar,
      isVerified: !!raw.isVerified,
    };
  };

  const loadMutuals = useCallback(
    async (pageToLoad: number, reset = false) => {
      if (!currentUserId) {
        setIsLoading(false);
        return;
      }

      if (reset) {
        setIsLoading(true);
      } else {
        if (!hasMore || isLoadingMore) return;
        setIsLoadingMore(true);
      }

      try {
        const start = Date.now();
        const response = await userService.getMutualFollows(currentUserId, debouncedQuery, pageToLoad, PAGE_SIZE);
        const normalized = response
          .map(normalizeResponse)
          .filter(user => !excludeSet.has(user.id));

        console.log('[telemetry] mutual_search', {
          query: debouncedQuery,
          resultCount: normalized.length,
          durationMs: Date.now() - start,
          page: pageToLoad,
        });

        setMutuals(prev => {
          const next = reset ? [] : [...prev];
          normalized.forEach(user => {
            if (!next.some(existing => existing.id === user.id)) {
              next.push(user);
            }
          });
          return next;
        });
        setHasMore(normalized.length === PAGE_SIZE);
        setPage(pageToLoad);
      } catch (error) {
        console.error('Error loading mutual follows:', error);
        if (reset) {
          setMutuals([]);
        }
        showAlert('Lỗi', 'Không thể tải danh sách người theo dõi qua lại');
        setHasMore(false);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [currentUserId, debouncedQuery, excludeSet, hasMore, isLoadingMore],
  );

  const handleToggle = (user: MutualUserOption) => {
    const next = { ...selectedUsers };
    if (next[user.id]) {
      delete next[user.id];
    } else {
      next[user.id] = user;
    }
    onSelectedChange(next);
  };

  const renderItem = ({ item }: { item: MutualUserOption }) => (
    <UserRow
      user={item}
      isSelected={!!selectedUsers[item.id]}
      onToggle={() => handleToggle(item)}
    />
  );

  const selectedCount = Object.keys(selectedUsers).length;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.border || '#e0e0e0',
          },
        ]}
      >
        <Ionicons
          name="search-outline"
          size={20}
          color={theme.colors.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Tìm người theo dõi nhau…"
          placeholderTextColor={theme.colors.textSecondary}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>

      {enableChips && selectedCount > 0 && (
        <SelectedChips
          selectedUsers={selectedUsers}
          onRemove={userId => {
            const toRemove = selectedUsers[userId];
            if (toRemove) {
              handleToggle(toRemove);
            }
          }}
        />
      )}

      {isLoading && mutuals.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      ) : mutuals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={48} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>{emptyMessage}</Text>
        </View>
      ) : (
        <FlatList
          data={mutuals}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          onEndReached={() => loadMutuals(page + 1)}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyText: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 14,
  },
  loadingMore: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});


