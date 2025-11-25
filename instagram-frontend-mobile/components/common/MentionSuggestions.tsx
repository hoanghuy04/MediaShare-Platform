import React, { useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    StyleProp,
    ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mentionService } from '../../services/mention.service';
import { MentionUserResponse } from '../../types/mention.type';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';

interface MentionSuggestionsProps {
    query: string;
    onSelect: (user: MentionUserResponse) => void;
    onClose: () => void;
    style?: StyleProp<ViewStyle>;
}

const MentionSuggestions: React.FC<MentionSuggestionsProps> = ({
    query,
    onSelect,
    onClose,
    style,
}) => {
    const fetchUsers = useCallback(
        async (page: number, limit: number) => {
            return await mentionService.searchUsers(query, page, limit);
        },
        [query]
    );

    const {
        data: suggestions,
        isLoading,
        isLoadingMore,
        loadMore,
        refresh,
    } = useInfiniteScroll<MentionUserResponse>({
        fetchFunc: fetchUsers,
        limit: 10,
    });

    useEffect(() => {
        refresh();
    }, [query, refresh]);

    const renderItem = ({ item }: { item: MentionUserResponse }) => (
        <TouchableOpacity
            style={styles.suggestionItem}
            onPress={() => onSelect(item)}
            activeOpacity={0.7}
        >
            {item.avatarUrl ? (
                <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
            ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Ionicons name="person" size={20} color="#999" />
                </View>
            )}

            <View style={styles.suggestionContent}>
                <View style={styles.nameRow}>
                    <Text style={styles.username} numberOfLines={1}>
                        {item.username}
                    </Text>
                    {item.verified && (
                        <Ionicons name="checkmark-circle" size={14} color="#0095f6" style={styles.verifiedIcon} />
                    )}
                </View>
                <Text style={styles.fullName} numberOfLines={1}>
                    {item.fullName}
                </Text>
            </View>
        </TouchableOpacity>
    );

    const renderFooter = () => {
        if (!isLoadingMore) return null;
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#c7c7c7" />
            </View>
        );
    };

    if (isLoading && suggestions.length === 0) {
        return (
            <View style={[styles.container, style, styles.loadingContainer]}>
                <ActivityIndicator size="large" color="#c7c7c7" />
            </View>
        );
    }

    return (
        <View style={[styles.container, style]}>
            <FlatList
                data={suggestions}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                style={styles.list}
                showsVerticalScrollIndicator={false}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
                keyboardShouldPersistTaps="always"
                nestedScrollEnabled={true}
                ListEmptyComponent={
                    !isLoading ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Không tìm thấy người dùng</Text>
                        </View>
                    ) : null
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
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 12,
        backgroundColor: '#f0f0f0',
    },
    avatarPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#efefef',
    },
    suggestionContent: {
        flex: 1,
        justifyContent: 'center',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    username: {
        fontSize: 14,
        fontWeight: '600',
        color: '#262626',
    },
    verifiedIcon: {
        marginLeft: 4,
    },
    fullName: {
        fontSize: 14,
        color: '#8e8e8e',
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerLoader: {
        paddingVertical: 10,
        alignItems: 'center',
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

export default MentionSuggestions;
