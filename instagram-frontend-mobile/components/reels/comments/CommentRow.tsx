import React, { useRef } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    Pressable,
    Animated as RNAnimated,
} from 'react-native';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { formatDate } from '../../../utils/formatters';
import { colors } from '../../../styles/colors';

type CommentAuthor = {
    id: string;
    username: string;
    avatarUrl?: string;
};

export type CommentData = {
    id: string;
    postId: string;
    author: CommentAuthor;
    text: string;
    totalLike: number;
    totalReply: number;
    createdAt: string;
    updatedAt: string;
    parentCommentId?: string;
    likedByCurrentUser?: boolean;
    isLikedByCurrentUser?: boolean;
    isPosting?: boolean;
    showReplies?: boolean;
    pinned?: boolean;
    authorCommentedPost?: boolean;
};

type CommentRowProps = {
    comment: CommentData;
    rootComment: CommentData;
    isReply?: boolean;
    onLike: (comment: CommentData, isReply: boolean, parentId?: string) => void;
    onReply: (comment: CommentData, rootComment: CommentData) => void;
    onToggleReplies?: (comment: CommentData) => void;
    onLongPress?: () => void;
    containerRef?: React.RefObject<View>;
};

const renderTextWithMentions = (text: string) => {
    const mentionRegex = /(@[\w.]+)/g;
    const parts = text.split(mentionRegex);

    return (
        <Text style={styles.commentText}>
            {parts.map((part, index) => {
                if (part.match(mentionRegex)) {
                    return (
                        <Text key={index} style={styles.mentionText}>
                            {part}
                        </Text>
                    );
                }
                return <Text key={index}>{part}</Text>;
            })}
        </Text>
    );
};

export const CommentRow = ({
    comment,
    rootComment,
    isReply = false,
    onLike,
    onReply,
    onToggleReplies,
    onLongPress,
    containerRef,
}: CommentRowProps) => {
    const avatarSize = isReply ? 28 : 36;
    const likeScale = useRef(new RNAnimated.Value(1)).current;

    const animateLike = () => {
        RNAnimated.sequence([
            RNAnimated.spring(likeScale, {
                toValue: 1.3,
                friction: 3,
                useNativeDriver: true,
            }),
            RNAnimated.spring(likeScale, {
                toValue: 1,
                friction: 3,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const handleLikePress = () => {
        animateLike();
        onLike(comment, isReply, isReply ? rootComment.id : undefined);
    };

    const isLiked = comment.likedByCurrentUser;

    return (
        <View ref={containerRef} collapsable={false}>
            <Pressable
                onLongPress={onLongPress}
                delayLongPress={300}
                style={[
                    comment.isPosting && styles.commentPostingWrapper,
                    { marginBottom: isReply ? 8 : 12 },
                ]}
            >
                <View style={[styles.commentItem, isReply && styles.replyContainer]}>
                    <Image
                        source={{
                            uri:
                                comment.author.avatarUrl ||
                                'https://i.pravatar.cc/150?u=1',
                        }}
                        style={[
                            styles.avatar,
                            {
                                width: avatarSize,
                                height: avatarSize,
                                borderRadius: avatarSize / 2,
                            },
                        ]}
                    />
                    <View style={styles.commentContent}>
                        <View style={styles.commentHeader}>
                            <Text style={styles.username}>{comment.author.username}</Text>
                            {!comment.isPosting && (
                                <>
                                    <Text style={styles.timeText}>
                                        {formatDate(comment.createdAt)}
                                    </Text>
                                    {comment.authorCommentedPost && (
                                        <Text style={styles.authorLabel}> · Tác giả</Text>
                                    )}
                                    {comment.pinned && (
                                        <AntDesign name="pushpin" size={12} color="#666" style={{ marginLeft: 6 }} />
                                    )}
                                </>
                            )}
                        </View>
                        {renderTextWithMentions(comment.text)}

                        {comment.isPosting ? (
                            <Text style={styles.postingText}>Đang đăng...</Text>
                        ) : (
                            <View style={styles.commentActions}>
                                <Pressable
                                    onPress={() => onReply(comment, rootComment)}
                                >
                                    <Text style={styles.actionText}>Trả lời</Text>
                                </Pressable>
                            </View>
                        )}

                        {!isReply && comment.totalReply > 0 && onToggleReplies && (
                            <Pressable
                                style={styles.viewRepliesButton}
                                onPress={() => onToggleReplies(comment)}
                                hitSlop={10}
                            >
                                <View style={styles.viewRepliesContainer}>
                                    <View style={styles.horizontalLine} />
                                    <Text style={styles.viewRepliesText}>
                                        {comment.showReplies
                                            ? 'Ẩn câu trả lời'
                                            : `Xem ${comment.totalReply} câu trả lời`}
                                    </Text>
                                </View>
                            </Pressable>
                        )}
                    </View>

                    {!comment.isPosting && (
                        <Pressable
                            style={styles.likeButton}
                            onPress={handleLikePress}
                        >
                            <RNAnimated.View style={{ transform: [{ scale: likeScale }] }}>
                                <Ionicons
                                    name={isLiked ? 'heart' : 'heart-outline'}
                                    size={14}
                                    color={isLiked ? '#F6434E' : '#666'}
                                />
                            </RNAnimated.View>
                            {comment.totalLike > 0 && (
                                <Text style={styles.likeCount}>{comment.totalLike}</Text>
                            )}
                        </Pressable>
                    )}
                </View>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    commentPostingWrapper: {
        backgroundColor: '#F5F8FF',
        padding: 8,
        borderRadius: 8,
        marginHorizontal: -8,
    },
    commentItem: {
        flexDirection: 'row',
    },
    replyContainer: {
        marginLeft: 48,
    },
    avatar: {
        backgroundColor: '#f0f0f0',
        marginRight: 12,
    },
    commentContent: {
        flex: 1,
    },
    commentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    username: {
        fontSize: 13,
        fontWeight: '600',
        color: '#000',
        marginRight: 8,
    },
    timeText: {
        fontSize: 12,
        color: '#999',
    },
    authorLabel: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    commentText: {
        fontSize: 14,
        color: '#000',
        lineHeight: 20,
    },
    mentionText: {
        color: colors.primary,
        fontWeight: '500',
    },
    postingText: {
        fontSize: 12,
        marginTop: 4,
        color: '#70747D',
        fontStyle: 'italic',
        fontWeight: '600',
    },
    commentActions: {
        flexDirection: 'row',
        marginTop: 4,
        gap: 16,
    },
    actionText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    likeButton: {
        alignItems: 'center',
        paddingLeft: 8,
        paddingTop: 4,
    },
    likeCount: {
        fontSize: 10,
        color: '#666',
        marginTop: 2,
    },
    viewRepliesButton: {
        marginTop: 12,
    },
    viewRepliesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    horizontalLine: {
        width: 24,
        height: 1,
        backgroundColor: '#ccc',
        marginRight: 12,
    },
    viewRepliesText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '600',
    },
});