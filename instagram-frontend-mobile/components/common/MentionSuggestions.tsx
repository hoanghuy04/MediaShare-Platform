import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mentionService } from '../../services/mention.service';
import { MentionUserResponse } from '../../types/mention.type';

interface MentionSuggestionsProps {
    query: string;
    onSelect: (user: MentionUserResponse) => void;
    onClose: () => void;
}

const MentionSuggestions: React.FC<MentionSuggestionsProps> = ({
    query,
    onSelect,
    onClose,
}) => {
    const [suggestions, setSuggestions] = useState<MentionUserResponse[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadSuggestions();
    }, [query]);

    const loadSuggestions = async () => {
        setLoading(true);
        try {
            if (query.trim().length > 0) {
                const result = await mentionService.searchUsers(query, 0, 10);
                setSuggestions(result.content || []);
            } else {
                // Optionally load recent mentions or suggested users when query is empty
                // For now, we can just search with empty string if the API supports it, or show nothing
                const result = await mentionService.searchUsers('', 0, 10);
                setSuggestions(result.content || []);
            }
        } catch (error) {
            console.error('[MentionSuggestions] Error loading suggestions:', error);
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    };

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

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#c7c7c7" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={suggestions}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                style={styles.list}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Không tìm thấy người dùng</Text>
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
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
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
