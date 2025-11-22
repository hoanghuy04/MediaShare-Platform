import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    Image,
    TextInput,
    ActivityIndicator,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    TouchableOpacity,
    Pressable,
    Animated as RNAnimated,
} from 'react-native';
import {
    FlatList,
    Gesture,
    GestureDetector,
    GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    interpolate,
    Extrapolation,
    Easing,
    LinearTransition,
    useAnimatedScrollHandler,
    useAnimatedReaction,
    SharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { scheduleOnRN } from 'react-native-worklets';

import { CommentResponse, CommentCreateRequest } from '../../types/post.type';
import { postCommentService } from '../../services/post-comment.service';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../styles/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const SNAP_TOP = 0;
const SNAP_HALF = SCREEN_HEIGHT * 0.5;
const SNAP_CLOSE = SCREEN_HEIGHT;

type Props = {
    visible: boolean;
    onClose: () => void;
    postId: string;
    modalTranslateY?: SharedValue<number>;
    isMuted?: boolean;
    onToggleMute?: () => void;
};

const EMOJIS = ['❤️', '🙌', '🔥', '👏', '😢', '😍', '😮', '😂'];

type CommentWithReplies = CommentResponse & {
    replies?: CommentWithReplies[];
    repliesLoaded?: boolean;
    showReplies?: boolean;
    isPosting?: boolean;
    loadingReplies?: boolean;
};

const CommentsModal = ({
    visible,
    onClose,
    postId,
    modalTranslateY,
    isMuted,
    onToggleMute,
}: Props) => {
    const insets = useSafeAreaInsets();
    const { user: currentUser } = useAuth();

    // ------- STATE -------
    const [comments, setComments] = useState<CommentWithReplies[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const [commentText, setCommentText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [replyingTo, setReplyingTo] = useState<CommentWithReplies | null>(null);
    const [rootIDToReply, setRootIDToReply] = useState<string | null>(null);

    const flatListRef = useRef<FlatList<CommentWithReplies>>(null);
    const inputRef = useRef<TextInput>(null);

    // ------- REANIMATED VALUES -------
    const translateY = useSharedValue(SNAP_CLOSE);
    const context = useSharedValue({ y: 0 });
    const scrollY = useSharedValue(0);
    const touchStart = useSharedValue(0);

    const onScroll = useAnimatedScrollHandler({
        onScroll: event => {
            scrollY.value = event.contentOffset.y;
        },
    });

    // ------- SHEET ANIMATION HELPERS -------
    const scrollTo = useCallback(
        (destination: number) => {
            'worklet';
            translateY.value = withSpring(destination, {
                damping: 50,
                stiffness: 300,
                mass: 1,
                overshootClamping: true,
            });
        },
        [translateY],
    );

    const closeSheet = useCallback(() => {
        'worklet';
        translateY.value = withTiming(
            SNAP_CLOSE,
            {
                duration: 250,
                easing: Easing.out(Easing.quad),
            },
            finished => {
                if (finished) {
                    scheduleOnRN(onClose);
                }
            },
        );
    }, [onClose, translateY]);

    const handleClose = useCallback(() => {
        Keyboard.dismiss();
        closeSheet();
    }, [closeSheet]);

    useAnimatedReaction(
        () => translateY.value,
        val => {
            if (modalTranslateY) {
                modalTranslateY.value = val;
            }
        },
    );

    // ------- FETCH COMMENTS WITH PAGINATION & DEDUP -------
    const loadComments = async (pageNum = 0) => {
        if (loading && pageNum !== 0) return;

        setLoading(true);
        try {
            const response = await postCommentService.getComments(postId, pageNum, 10);
            const list = (response.content || []).map(
                c => ({ ...c } as CommentWithReplies),
            );

            if (list.length < 10) {
                setHasMore(false);
            }

            setComments(prev => {
                if (pageNum === 0) {
                    return list;
                }

                const existingIds = new Set(prev.map(c => c.id));
                const newOnes = list.filter(c => !existingIds.has(c.id));
                return [...prev, ...newOnes];
            });
        } catch (error) {
            console.error('[CommentModal] Failed to load comments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLoadMore = () => {
        if (!loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            loadComments(nextPage);
        }
    };

    const renderFooter = () => {
        if (loading && comments.length > 0) {
            return (
                <View style={{ paddingVertical: 20 }}>
                    <ActivityIndicator size="small" color={colors.primary} />
                </View>
            );
        }
        return <View style={{ height: 20 }} />;
    };

    const CommentSkeleton = () => (
        <View style={styles.skeletonContainer}>
            {[1, 2, 3].map((item) => (
                <View key={item} style={styles.skeletonItem}>
                    <View style={styles.skeletonAvatar} />
                    <View style={styles.skeletonContent}>
                        <View style={styles.skeletonLine} />
                        <View style={[styles.skeletonLine, { width: '60%' }]} />
                    </View>
                </View>
            ))}
        </View>
    );

    const renderEmpty = () => {
        if (loading && comments.length === 0) {
            return <CommentSkeleton />;
        }
        if (!loading && comments.length === 0) {
            return (
                <Text style={{ textAlign: 'center', marginTop: 20, color: '#666' }}>
                    Chưa có bình luận nào.
                </Text>
            );
        }
        return null;
    };

    // ------- EFFECT: OPEN/CLOSE MODAL -------
    useEffect(() => {
        if (visible) {
            translateY.value = SNAP_CLOSE;
            scrollTo(SNAP_HALF);
            setPage(0);
            setHasMore(true);
            setComments([]);
            loadComments(0);
        } else {
            setCommentText('');
            setReplyingTo(null);
            setRootIDToReply(null);
            Keyboard.dismiss();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, postId]);

    // ------- EFFECT: KEYBOARD -> SNAP TOP -------
    useEffect(() => {
        const showEvent =
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const keyboardShowListener = Keyboard.addListener(showEvent, () => {
            scrollTo(SNAP_TOP);
        });
        return () => keyboardShowListener.remove();
    }, [scrollTo]);

    // ------- REPLY HANDLERS -------
    const handleReply = (
        targetComment: CommentWithReplies,
        rootComment: CommentWithReplies,
    ) => {
        setReplyingTo(targetComment);
        setRootIDToReply(rootComment.id);
        setCommentText(`@${targetComment.author.username} `);
        inputRef.current?.focus();
    };

    const handleCancelReply = () => {
        setReplyingTo(null);
        setRootIDToReply(null);
        setCommentText('');
        Keyboard.dismiss();
    };

    const handleToggleReplies = async (parent: CommentWithReplies) => {
        if (parent.repliesLoaded) {
            setComments(prev =>
                prev.map(c =>
                    c.id === parent.id ? { ...c, showReplies: !c.showReplies } : c,
                ),
            );
            return;
        }

        setComments(prev =>
            prev.map(c =>
                c.id === parent.id ? { ...c, loadingReplies: true } : c,
            ),
        );

        try {
            const response = await postCommentService.getReplies(
                postId,
                parent.id,
                0,
                10,
            );
            const replies = (response.content || []).map(
                r => ({ ...r } as CommentWithReplies),
            );
            setComments(prev =>
                prev.map(c =>
                    c.id === parent.id
                        ? {
                            ...c,
                            replies,
                            repliesLoaded: true,
                            showReplies: true,
                            loadingReplies: false,
                        }
                        : c,
                ),
            );
        } catch (error) {
            console.error('[CommentModal] Failed to load replies:', error);
            // Remove loading state on error
            setComments(prev =>
                prev.map(c =>
                    c.id === parent.id ? { ...c, loadingReplies: false } : c,
                ),
            );
        }
    };

    // ------- LIKE HANDLER (OPTIMISTIC) -------
    const handleLikeComment = async (
        comment: CommentWithReplies,
        isReply: boolean,
        parentId?: string,
    ) => {
        const optimisticLiked = !comment.isLikedByCurrentUser;
        const optimisticLikes = optimisticLiked
            ? (comment.totalLike || 0) + 1
            : Math.max(0, (comment.totalLike || 0) - 1);

        if (isReply && parentId) {
            setComments(prev =>
                prev.map(c => {
                    if (c.id !== parentId) return c;
                    return {
                        ...c,
                        replies: c.replies?.map(r =>
                            r.id === comment.id
                                ? {
                                    ...r,
                                    isLikedByCurrentUser: optimisticLiked,
                                    totalLike: optimisticLikes,
                                }
                                : r,
                        ),
                    };
                }),
            );
        } else {
            setComments(prev =>
                prev.map(c =>
                    c.id === comment.id
                        ? {
                            ...c,
                            isLikedByCurrentUser: optimisticLiked,
                            totalLike: optimisticLikes,
                        }
                        : c,
                ),
            );
        }

        try {
            const result = await postCommentService.toggleLikeComment(
                postId,
                comment.id,
            );

            if (isReply && parentId) {
                setComments(prev =>
                    prev.map(c => {
                        if (c.id !== parentId) return c;
                        return {
                            ...c,
                            replies: c.replies?.map(r =>
                                r.id === comment.id
                                    ? {
                                        ...r,
                                        isLikedByCurrentUser: result.liked,
                                        totalLike: result.totalLikes,
                                    }
                                    : r,
                            ),
                        };
                    }),
                );
            } else {
                setComments(prev =>
                    prev.map(c =>
                        c.id === comment.id
                            ? {
                                ...c,
                                isLikedByCurrentUser: result.liked,
                                totalLike: result.totalLikes,
                            }
                            : c,
                    ),
                );
            }
        } catch (error) {
            console.error('[CommentModal] Failed to toggle like:', error);
            if (isReply && parentId) {
                setComments(prev =>
                    prev.map(c => {
                        if (c.id !== parentId) return c;
                        return {
                            ...c,
                            replies: c.replies?.map(r =>
                                r.id === comment.id ? { ...r, ...comment } : r,
                            ),
                        };
                    }),
                );
            } else {
                setComments(prev =>
                    prev.map(c => (c.id === comment.id ? { ...c, ...comment } : c)),
                );
            }
        }
    };

    // ------- SEND COMMENT -------
    const handleSendComment = async () => {
        const text = commentText.trim();
        if (!text || submitting) return;

        const tempId = Date.now().toString();
        const parentId = rootIDToReply;

        const tempComment: CommentWithReplies = {
            id: tempId,
            postId: postId,
            author: {
                id: currentUser?.id || 'me',
                username: currentUser?.username || 'Me',
                avatarUrl: currentUser?.avatar || 'https://i.pravatar.cc/150?u=1',
            },
            text: text,
            totalLike: 0,
            totalReply: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            parentCommentId: parentId || undefined,
            isLikedByCurrentUser: false,
            isPosting: true,
        };

        setCommentText('');
        setReplyingTo(null);
        setRootIDToReply(null);
        inputRef.current?.blur();

        if (parentId) {
            setComments(prev =>
                prev.map(c => {
                    if (c.id !== parentId) return c;
                    const newReplies = c.replies ? [...c.replies, tempComment] : [tempComment];
                    return {
                        ...c,
                        replies: newReplies,
                        showReplies: true,
                        totalReply: (c.totalReply || 0) + 1,
                    };
                }),
            );
        } else {
            setComments(prev => [tempComment, ...prev]);
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }

        setSubmitting(true);
        try {
            const request: CommentCreateRequest = {
                text,
                parentCommentId: parentId || undefined,
            };

            const newComment = await postCommentService.createComment(postId, request);

            if (parentId) {
                setComments(prev =>
                    prev.map(c => {
                        if (c.id !== parentId) return c;
                        const updatedReplies = c.replies?.map(r =>
                            r.id === tempId
                                ? ({ ...(newComment as CommentWithReplies) } as CommentWithReplies)
                                : r,
                        );
                        return {
                            ...c,
                            replies: updatedReplies,
                        };
                    }),
                );
            } else {
                setComments(prev =>
                    prev.map(c =>
                        c.id === tempId
                            ? ({ ...(newComment as CommentWithReplies) } as CommentWithReplies)
                            : c,
                    ),
                );
            }
        } catch (error) {
            console.error('[CommentModal] Failed to post comment:', error);
            if (parentId) {
                setComments(prev =>
                    prev.map(c => {
                        if (c.id !== parentId) return c;
                        return {
                            ...c,
                            replies: c.replies?.filter(r => r.id !== tempId),
                            totalReply: Math.max(0, (c.totalReply || 0) - 1),
                        };
                    }),
                );
            } else {
                setComments(prev => prev.filter(c => c.id !== tempId));
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleInputFocus = () => {
        scrollTo(SNAP_TOP);
    };

    // ------- PAN GESTURE -------
    const nativeGesture = Gesture.Native();

    const panGesture = Gesture.Pan()
        .manualActivation(true)
        .onTouchesDown((e, stateManager) => {
            touchStart.value = e.allTouches[0].absoluteY;
        })
        .onTouchesMove((e, stateManager) => {
            const currentY = e.allTouches[0].absoluteY;
            const deltaY = currentY - touchStart.value;
            const effectiveTop = insets.top;

            if (translateY.value > effectiveTop + 2) {
                stateManager.activate();
                return;
            }

            if (scrollY.value <= 0) {
                if (deltaY > 5) {
                    stateManager.activate();
                } else if (deltaY < -5) {
                    stateManager.fail();
                }
            } else {
                stateManager.fail();
            }
        })
        .onStart(() => {
            context.value = { y: translateY.value };
        })
        .onUpdate(event => {
            const effectiveTop = insets.top;
            let newY = context.value.y + event.translationY;
            if (newY < effectiveTop) newY = effectiveTop;
            translateY.value = newY;
        })
        .onEnd(event => {
            const { velocityY } = event;
            const currentY = translateY.value;
            const effectiveTop = insets.top;

            if (currentY <= effectiveTop + 5 && velocityY < 500) {
                scrollTo(SNAP_TOP);
                return;
            }

            if (velocityY > 1000) {
                if (currentY > SNAP_HALF) {
                    closeSheet();
                } else {
                    scrollTo(SNAP_HALF);
                }
            } else if (velocityY < -1000) {
                scrollTo(SNAP_TOP);
            } else {
                if (currentY < SNAP_HALF / 2) {
                    scrollTo(SNAP_TOP);
                } else if (currentY < (SNAP_HALF + SNAP_CLOSE) / 2) {
                    scrollTo(SNAP_HALF);
                } else {
                    closeSheet();
                }
            }
        });

    // ------- ANIMATED STYLES -------
    const rStyle = useAnimatedStyle(() => ({
        top: translateY.value,
    }));

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: interpolate(
            translateY.value,
            [SNAP_HALF, SNAP_CLOSE],
            [1, 0],
            Extrapolation.CLAMP,
        ),
    }));

    const muteOverlayStyle = useAnimatedStyle(() => {
        const sheetTop = translateY.value;
        const iconTop = sheetTop - 40;

        return {
            top: iconTop,
            opacity: interpolate(
                translateY.value,
                [SNAP_HALF, SNAP_CLOSE],
                [1, 0],
                Extrapolation.CLAMP,
            ),
        };
    });

    const isSendButtonActive = commentText.trim().length > 0;

    // ------- RENDER COMMENT TEXT -------
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

    // ------- COMMENT ROW COMPONENT -------
    const CommentRow = ({
        comment,
        rootComment,
        isReply = false,
    }: {
        comment: CommentWithReplies;
        rootComment: CommentWithReplies;
        isReply?: boolean;
    }) => {
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
            handleLikeComment(
                comment,
                isReply,
                isReply ? rootComment.id : undefined,
            );
        };

        return (
            <View
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
                                <Text style={styles.timeText}>
                                    {formatDistanceToNow(new Date(comment.createdAt), {
                                        addSuffix: true,
                                        locale: vi,
                                    })}
                                </Text>
                            )}
                        </View>
                        {renderTextWithMentions(comment.text)}

                        {comment.isPosting ? (
                            <Text style={styles.postingText}>Đang đăng...</Text>
                        ) : (
                            <>
                                <View style={styles.commentActions}>
                                    <Pressable
                                        onPress={() => handleReply(comment, rootComment)}
                                    >
                                        <Text style={styles.actionText}>Trả lời</Text>
                                    </Pressable>
                                </View>

                                {!isReply && (comment.totalReply || 0) > 0 && (
                                    <Pressable
                                        onPress={() => handleToggleReplies(comment)}
                                        style={styles.viewRepliesButton}
                                    >
                                        <Text style={styles.viewRepliesText}>
                                            {comment.showReplies
                                                ? 'Ẩn trả lời'
                                                : `Xem ${comment.totalReply} câu trả lời`}
                                        </Text>
                                    </Pressable>
                                )}
                            </>
                        )}
                    </View>

                    {!comment.isPosting && (
                        <Pressable
                            style={styles.likeButton}
                            onPress={handleLikePress}
                        >
                            <RNAnimated.View style={{ transform: [{ scale: likeScale }] }}>
                                <Ionicons
                                    name={
                                        comment.isLikedByCurrentUser ? 'heart' : 'heart-outline'
                                    }
                                    size={14}
                                    color={
                                        comment.isLikedByCurrentUser ? '#F6434E' : '#666'
                                    }
                                />
                            </RNAnimated.View>
                            {comment.totalLike > 0 && (
                                <Text style={styles.likeCount}>{comment.totalLike}</Text>
                            )}
                        </Pressable>
                    )}
                </View>
            </View>
        );
    };

    const renderCommentItem = ({
        item,
        index,
    }: {
        item: CommentWithReplies;
        index: number;
    }) => (
        <View style={styles.commentBlock}>
            <CommentRow comment={item} rootComment={item} />

            {item.loadingReplies && (
                <View style={{ paddingLeft: 48, paddingVertical: 10 }}>
                    <ActivityIndicator size="small" color={colors.primary} />
                </View>
            )}

            {item.showReplies &&
                item.replies &&
                item.replies.map((reply, index) => (
                    <CommentRow
                        key={`reply-${reply.id}-${index}`}
                        comment={reply}
                        rootComment={item}
                        isReply
                    />
                ))}
        </View>
    );

    // ------- RENDER MODAL -------
    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            statusBarTranslucent
            onRequestClose={handleClose}
        >
            <GestureHandlerRootView style={styles.modalOverlay}>
                <Animated.View style={[styles.backdrop, backdropStyle]}>
                    <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        activeOpacity={1}
                        onPress={handleClose}
                    />
                </Animated.View>

                {onToggleMute && (
                    <Animated.View
                        style={[styles.muteOverlayButton, muteOverlayStyle]}
                    >
                        <Pressable onPress={onToggleMute} hitSlop={10}>
                            <Ionicons
                                name={isMuted ? 'volume-mute' : 'volume-high'}
                                size={20}
                                color="#fff"
                            />
                        </Pressable>
                    </Animated.View>
                )}

                <Animated.View style={[styles.modalContent, rStyle]}>
                    <GestureDetector gesture={panGesture}>
                        <View style={{ flex: 1 }}>
                            <View style={styles.dragHandleArea}>
                                <View style={styles.handleBarContainer}>
                                    <View style={styles.handleBar} />
                                </View>
                                <Text style={styles.headerTitle}>Bình luận</Text>
                            </View>

                            <View style={{ flex: 1 }}>
                                <View style={styles.listWrapper}>
                                    <GestureDetector gesture={nativeGesture}>
                                        <Animated.FlatList
                                            ref={flatListRef as any}
                                            data={comments}
                                            renderItem={renderCommentItem}
                                            keyExtractor={(
                                                item: CommentWithReplies,
                                                index,
                                            ) => `${item.id}-${index}`}
                                            contentContainerStyle={styles.listContent}
                                            showsVerticalScrollIndicator={false}
                                            keyboardShouldPersistTaps="always"
                                            keyboardDismissMode="on-drag"
                                            onEndReached={handleLoadMore}
                                            onEndReachedThreshold={0.5}
                                            ListFooterComponent={renderFooter}
                                            ListEmptyComponent={renderEmpty}
                                            bounces
                                            itemLayoutAnimation={LinearTransition}
                                            onScroll={onScroll}
                                            scrollEventThrottle={16}
                                        />
                                    </GestureDetector>
                                </View>
                            </View>
                        </View>
                    </GestureDetector>

                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        keyboardVerticalOffset={0}
                        style={styles.inputContainer}
                    >
                        {replyingTo && (
                            <View style={styles.replyBanner}>
                                <Text style={styles.replyText}>
                                    Đang trả lời {replyingTo.author.username}
                                </Text>
                                <Pressable onPress={handleCancelReply}>
                                    <Ionicons name="close" size={20} color="#666" />
                                </Pressable>
                            </View>
                        )}

                        <View style={styles.emojiBar}>
                            {EMOJIS.map((emoji, index) => (
                                <Pressable
                                    key={index}
                                    onPress={() =>
                                        setCommentText(prev => prev + emoji)
                                    }
                                    style={styles.emojiButton}
                                >
                                    <Text style={styles.emojiText}>{emoji}</Text>
                                </Pressable>
                            ))}
                        </View>

                        <View style={styles.inputRow}>
                            <Image
                                source={{
                                    uri:
                                        currentUser?.avatar ||
                                        'https://i.pravatar.cc/150?u=1',
                                }}
                                style={styles.inputAvatar}
                            />
                            <TextInput
                                ref={inputRef}
                                style={styles.input}
                                placeholder="Thêm bình luận..."
                                placeholderTextColor="#999"
                                value={commentText}
                                onChangeText={setCommentText}
                                multiline
                                onFocus={handleInputFocus}
                            />
                            <Pressable
                                onPress={handleSendComment}
                                disabled={!isSendButtonActive || submitting}
                                style={styles.sendButton}
                            >
                                <Ionicons
                                    name="arrow-up-circle"
                                    size={32}
                                    color={
                                        isSendButtonActive
                                            ? colors.primary
                                            : '#E0E0E0'
                                    }
                                />
                            </Pressable>
                        </View>
                    </KeyboardAvoidingView>
                </Animated.View>
            </GestureHandlerRootView>
        </Modal>
    );
};

export default CommentsModal;

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        position: 'absolute',
        width: '100%',
        bottom: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
        overflow: 'hidden',
    },
    dragHandleArea: {
        backgroundColor: '#fff',
        paddingBottom: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: '#eee',
        zIndex: 10,
    },
    muteOverlayButton: {
        position: 'absolute',
        right: 16,
        backgroundColor: 'rgba(0,0,0,0.55)',
        borderRadius: 18,
        padding: 8,
        zIndex: 50,
    },
    handleBarContainer: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 12,
    },
    handleBar: {
        width: 40,
        height: 4,
        backgroundColor: '#ddd',
        borderRadius: 2,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        textAlign: 'center',
        marginBottom: 12,
    },
    listWrapper: {
        flex: 1,
        backgroundColor: '#fff',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    loader: {
        marginTop: 40,
    },
    commentBlock: {
        marginBottom: 12,
    },
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
    viewRepliesText: {
        fontSize: 12,
        color: '#999',
        fontWeight: '500',
    },
    viewRepliesButton: {
        marginTop: 8,
        marginLeft: 0,
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
    inputContainer: {
        borderTopWidth: 1,
        borderTopColor: '#EFEFEF',
        backgroundColor: '#fff',
        paddingBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 20,
    },
    replyBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#f0f0f0',
        borderBottomWidth: 0.5,
        borderBottomColor: '#ddd',
    },
    replyText: {
        fontSize: 12,
        color: '#666',
    },
    emojiBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    emojiButton: {
        padding: 4,
    },
    emojiText: {
        fontSize: 24,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 12,
    },
    inputAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f0f0f0',
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#000',
        maxHeight: 100,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#dbdbdb',
        borderRadius: 24,
        backgroundColor: '#fafafa',
    },
    sendButton: {
        padding: 4,
        marginLeft: 4,
    },
    skeletonContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    skeletonItem: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    skeletonAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#E0E0E0',
        marginRight: 12,
    },
    skeletonContent: {
        flex: 1,
    },
    skeletonLine: {
        height: 12,
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
        marginBottom: 8,
    },
});
