import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hashtagService } from '../../services/hashtag.service';
import { HashtagResponse } from '../../types/hashtag.type';

interface HashtagSuggestionsProps {
  query: string;
  onSelect: (tag: string) => void;
  onClose: () => void;
}

const HashtagSuggestions: React.FC<HashtagSuggestionsProps> = ({
  query,
  onSelect,
  onClose,
}) => {
  const [suggestions, setSuggestions] = useState<HashtagResponse[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('[HashtagSuggestions] Query changed:', query);
    loadSuggestions();
  }, [query]);

  const loadSuggestions = async () => {
    console.log('[HashtagSuggestions] Loading suggestions for query:', query);
    setLoading(true);
    try {
      if (query.trim().length > 0) {
        // Search hashtags matching query
        console.log('[HashtagSuggestions] Searching for:', query);
        const results = await hashtagService.search(query);
        console.log('[HashtagSuggestions] Search results:', results);
        setSuggestions(results.slice(0, 10)); // Limit to 10 suggestions
      } else {
        // Show trending hashtags when no query
        console.log('[HashtagSuggestions] Loading trending hashtags');
        const trending = await hashtagService.getTrending(10);
        console.log('[HashtagSuggestions] Trending results:', trending);
        setSuggestions(trending);
      }
    } catch (error) {
      console.error('[HashtagSuggestions] Error loading hashtag suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)} triệu`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const renderItem = ({ item }: { item: HashtagResponse }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => onSelect(item.tag)}
      activeOpacity={0.7}
    >
      <View style={styles.hashIcon}>
        <Text style={styles.hashSymbol}>#</Text>
      </View>
      
      <View style={styles.suggestionContent}>
        <Text style={styles.hashtagText}>#{item.tag}</Text>
        <Text style={styles.countText}>
          {formatCount(item.usageCount)} bài viết
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => {
    return null;
  };

  if (loading) {
    console.log('[HashtagSuggestions] Rendering loading state');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#c7c7c7" />
        <Text style={styles.loadingText}>Đang tìm kiếm "{query}"</Text>
      </View>
    );
  }

  console.log('[HashtagSuggestions] Rendering suggestions:', { 
    query, 
    suggestionsCount: suggestions.length,
    showSuggestions: suggestions.length > 0 
  });

  return (
    <View style={styles.container}>
      {renderHeader()}
      <FlatList
        data={suggestions}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Không tìm thấy hashtag</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  list: {
    flex: 1,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  hashIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#efefef',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  hashSymbol: {
    fontSize: 20,
    fontWeight: '700',
    color: '#262626',
  },
  suggestionContent: {
    flex: 1,
  },
  hashtagText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
    marginBottom: 2,
  },
  countText: {
    fontSize: 12,
    color: '#8e8e8e',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#8e8e8e',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#8e8e8e',
  },
});

export default HashtagSuggestions;
