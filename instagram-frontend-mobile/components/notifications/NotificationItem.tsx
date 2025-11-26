import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { NotificationResponse, NotificationType } from '../../types/notification';
import { formatDate } from '../../utils/formatters';

import { FollowButton } from '../common/FollowButton';

interface Props {
    item: NotificationResponse;
    onPress: (item: NotificationResponse) => void;
}

const NotificationItem: React.FC<Props> = ({ item, onPress }) => {

    // Render phần bên phải (Nút theo dõi hoặc Ảnh thumbnail bài viết)
    const renderRightContent = () => {
        if (item.type === 'FOLLOW') {
            return (
                <FollowButton
                    userId={item.author?.id || ''}
                    initialIsFollowing={item.isFollowingBack}
                    onFollowChange={() => onPress(item)} // Mark as read when follow status changes
                    notFollowingText="Theo dõi lại"
                    followingText="Đang theo dõi"
                    size="small"
                    variant="primary"
                    style={{ minWidth: 100 }}
                />
            );
        }

        if ((item.type === 'LIKE_POST' || item.type === 'COMMENT_POST' || item.type === 'TAG_IN_POST' || item.type === 'TAG_IN_COMMENT') && item.postThumbnail) {
            return (
                <Image source={{ uri: item.postThumbnail }} style={styles.postThumbnail} />
            );
        }

        return null;
    };

    return (
        <TouchableOpacity style={styles.container} onPress={() => onPress(item)} activeOpacity={0.7}>
            {/* 1. Avatar bên trái */}
            <View style={styles.avatarContainer}>
                {item.author?.avatar ? (
                    <Image source={{ uri: item.author.avatar }} style={styles.avatar} />
                ) : (
                    // Placeholder cho system icon
                    <View style={[styles.avatar, { backgroundColor: '#ddd' }]} />
                )}
            </View>

            {/* 2. Nội dung ở giữa */}
            <View style={styles.contentContainer}>
                <Text numberOfLines={3} style={styles.textWrapper}>
                    {item.author && (
                        <Text style={styles.username}>{item.author.username} </Text>
                    )}
                    <Text style={styles.content}>{item.content} </Text>
                    <Text style={styles.time}>{formatDate(item.createdAt)}</Text>
                </Text>
            </View>

            {/* 3. Action bên phải */}
            <View style={styles.rightContainer}>
                {renderRightContent()}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
    },
    avatarContainer: {
        marginRight: 12,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: '#eee',
    },
    contentContainer: {
        flex: 1,
        marginRight: 8,
    },
    textWrapper: {
        fontSize: 14,
        lineHeight: 18,
        color: '#000',
    },
    username: {
        fontWeight: 'bold',
    },
    content: {
        fontWeight: 'normal',
    },
    time: {
        color: '#666',
        fontSize: 13,
    },
    rightContainer: {
        minWidth: 44,
        alignItems: 'flex-end',
    },
    postThumbnail: {
        width: 44,
        height: 44,
        borderRadius: 4, // Instagram bo góc nhẹ ở ảnh thumbnail
    },
    // Style cho nút Follow
    btnFollow: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnFollowActive: {
        backgroundColor: '#0095f6', // Màu xanh Instagram
    },
    btnFollowBack: {
        backgroundColor: '#efefef', // Màu xám nhạt
    },
    btnText: {
        fontSize: 14,
        fontWeight: '600',
    },
    textFollowActive: {
        color: '#fff',
    },
    textFollowBack: {
        color: '#000',
    },
});

export default NotificationItem;
