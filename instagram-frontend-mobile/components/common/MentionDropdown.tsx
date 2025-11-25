import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    FlatList,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MentionUserResponse } from '@/types/mention.type';

interface MentionDropdownProps {
    visible: boolean;
    suggestions: MentionUserResponse[];
    isSearching: boolean;
    searchQuery: string;
    onSelectMention: (user: MentionUserResponse) => void;
    dropdownStyle?: any; // Allow flexible styling (top or bottom)
}

export const MentionDropdown: React.FC<MentionDropdownProps> = ({
    visible,
    suggestions,
    isSearching,
    searchQuery,
    onSelectMention,
    dropdownStyle,
}) => {
    if (!visible) return null;

    const renderMentionItem = ({ item }: { item: MentionUserResponse }) => (
        <TouchableOpacity
            style={styles.mentionItem}
            onPress={() => onSelectMention(item)}
        >
            {item.avatarUrl ? (
                <Image source={{ uri: item.avatarUrl }} style={styles.mentionAvatar} />
            ) : (
                <View style={[styles.mentionAvatar, styles.mentionAvatarPlaceholder]}>
                    <Ionicons name="person" size={20} color="#999" />
                </View>
            )}
            <View style={styles.mentionTextContainer}>
                <View style={styles.mentionNameRow}>
                    <Text style={styles.mentionFullName} numberOfLines={1}>
                        {item.fullName}
                    </Text>
                    {item.verified && (
                        <Ionicons name="checkmark-circle" size={14} color="#0095f6" style={{ marginLeft: 4 }} />
                    )}
                </View>
                <Text style={styles.mentionUsername} numberOfLines={1}>
                    {item.username}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.mentionDropdown, dropdownStyle]}>
            {isSearching ? (
                <View style={styles.mentionLoading}>
                    <ActivityIndicator size="small" color="#999" />
                </View>
            ) : suggestions.length > 0 ? (
                <FlatList
                    data={suggestions}
                    renderItem={renderMentionItem}
                    keyExtractor={item => item.id}
                    style={styles.mentionList}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={true}
                />
            ) : searchQuery ? (
                <View style={styles.mentionEmpty}>
                    <Text style={styles.mentionEmptyText}>Không tìm thấy người dùng</Text>
                </View>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    mentionDropdown: {
        position: 'absolute',
        left: 16,
        right: 16,
        backgroundColor: '#fff',
        maxHeight: 250,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 10,
        zIndex: 9999, // Very high z-index to ensure it's above everything
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 12,
            },
            android: {
                elevation: 10,
            },
        }),
    },
    mentionList: {
        flex: 1,
    },
    mentionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        backgroundColor: '#fff',
    },
    mentionAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 12,
    },
    mentionAvatarPlaceholder: {
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    mentionTextContainer: {
        flex: 1,
    },
    mentionNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    mentionFullName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
    },
    mentionUsername: {
        fontSize: 14,
        color: '#8e8e8e',
        marginTop: 2,
    },
    mentionLoading: {
        padding: 20,
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    mentionEmpty: {
        padding: 20,
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    mentionEmptyText: {
        fontSize: 14,
        color: '#8e8e8e',
    },
});
