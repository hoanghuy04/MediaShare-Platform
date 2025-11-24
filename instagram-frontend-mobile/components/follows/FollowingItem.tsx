import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SimpleUserResponse } from '../../types/user';
import { Avatar } from '../common/Avatar';
import { Theme } from '../../styles/theme';

interface FollowingItemProps {
    item: SimpleUserResponse;
    currentUserId?: string;
    theme: Theme;
}

export const FollowingItem: React.FC<FollowingItemProps> = ({
    item,
    currentUserId,
    theme,
}) => {
    const router = useRouter();
    const isCurrentUser = currentUserId === item.id;

    return (
        <TouchableOpacity style={styles.userItem} onPress={() => router.push(`/users/${item.id}`)}>
            <View style={styles.userInfo}>
                <Avatar uri={item.avatarUrl} name={item.username} size={44} style={styles.avatar} />
                <View>
                    <Text style={[styles.username, { color: theme.colors.text }]}>{item.username}</Text>
                    <Text style={[styles.fullname, { color: theme.colors.gray }]}>{item.username}</Text>
                </View>
            </View>

            <View style={styles.actions}>
                {!isCurrentUser && (
                    <TouchableOpacity
                        style={[styles.messageButton, { backgroundColor: theme.colors.inputBackground }]}
                        onPress={() => { }}
                    >
                        <Text style={[styles.messageButtonText, { color: theme.colors.text }]}>Nhắn tin</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.menuButton}>
                    <Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.text} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    userItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        marginRight: 12,
    },
    username: {
        fontSize: 16,
        fontWeight: '600',
    },
    fullname: {
        fontSize: 14,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    messageButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    messageButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    menuButton: {
        padding: 4,
    },
});
