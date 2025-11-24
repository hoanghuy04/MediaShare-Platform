import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Dimensions,
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
import { scheduleOnRN } from 'react-native-worklets';

import { postCommentService } from '../../services/post-comment.service';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../styles/colors';
import { CommentCreateRequest, CommentResponse } from '../../types/comment.type';
import {
  CommentSkeleton,
  CommentHeader,
  CommentInput,
  CommentActionMenu,
  CommentData,
  UnpinCommentModal,
} from './comments';
import { CommentItemWrapper } from './comments/CommentItemWrapper';
import { Toast } from './comments/Toast';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const SNAP_TOP = 0;
const SNAP_HALF = SCREEN_HEIGHT * 0.5;
const SNAP_CLOSE = SCREEN_HEIGHT;

type Props = {
  visible: boolean;
  onClose: () => void;
  postId: string;
  postAuthorId: string;
  modalTranslateY?: SharedValue<number>;
  isMuted?: boolean;
  onToggleMute?: () => void;
  onCommentChange?: (delta: number) => void;
};

type CommentWithReplies = CommentData & {
  replies?: CommentWithReplies[];
  repliesLoaded?: boolean;
  showReplies?: boolean;
  loadingReplies?: boolean;
};

const CommentsModal = ({
  visible,
  onClose,
  postId,
  postAuthorId,
  modalTranslateY,
  isMuted,
  onToggleMute,
  onCommentChange,
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

  const [selectedComment, setSelectedComment] = useState<CommentWithReplies | null>(null);
  const [selectedLayout, setSelectedLayout] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const flatListRef = useRef<FlatList<CommentWithReplies>>(null);
  const inputRef = useRef<TextInput>(null);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastConfig, setToastConfig] = useState<{
    type: 'undo' | 'info' | 'loading';
    position: 'bottom' | 'center';
    duration?: number;
  }>({ type: 'info', position: 'bottom', duration: 4000 });

  const undoTimeoutRef = useRef<any>(null);
  const deletedRef = useRef<{
    comment: CommentWithReplies;
    isReply: boolean;
    parentId?: string;
  } | null>(null);

  const showToast = (
    message: string,
    type: 'undo' | 'info' | 'loading' = 'info',
    position: 'bottom' | 'center' = 'bottom',
    duration = 4000
  ) => {
    setToastMessage(message);
    setToastConfig({ type, position, duration });
    setToastVisible(true);
  };

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
    [translateY]
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
      }
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
    }
  );

  // ------- FETCH COMMENTS WITH PAGINATION & DEDUP -------
  const loadComments = async (pageNum = 0) => {
    if (loading && pageNum !== 0) return;

    setLoading(true);
    try {
      const response = await postCommentService.getComments(postId, pageNum, 10);
      console.log(response.content);
      const list = (response.content || []).map(c => ({ ...c } as CommentWithReplies));

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
      // Reset translateY to SNAP_CLOSE when modal closes
      translateY.value = SNAP_CLOSE;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, postId]);

  // ------- EFFECT: KEYBOARD -> SNAP TOP -------
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const keyboardShowListener = Keyboard.addListener(showEvent, () => {
      scrollTo(SNAP_TOP);
    });
    return () => keyboardShowListener.remove();
  }, [scrollTo]);

  // ------- REPLY HANDLERS -------
  const handleReply = (targetComment: CommentWithReplies, rootComment: CommentWithReplies) => {
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

  // ------- TOGGLE REPLIES -------
  const handleToggleReplies = async (comment: CommentWithReplies) => {
    if (comment.showReplies) {
      setComments(prev => prev.map(c => (c.id === comment.id ? { ...c, showReplies: false } : c)));
      return;
    }

    if (comment.repliesLoaded && comment.replies && comment.replies.length > 0) {
      setComments(prev => prev.map(c => (c.id === comment.id ? { ...c, showReplies: true } : c)));
      return;
    }

    setComments(prev => prev.map(c => (c.id === comment.id ? { ...c, loadingReplies: true } : c)));

    try {
      const response = await postCommentService.getReplies(postId, comment.id, 0, 50);
      const replies = (response.content || []).map(r => ({ ...r } as CommentWithReplies));

      setComments(prev =>
        prev.map(c =>
          c.id === comment.id
            ? {
              ...c,
              replies,
              repliesLoaded: true,
              showReplies: true,
              loadingReplies: false,
            }
            : c
        )
      );
    } catch (error) {
      console.error('[CommentModal] Failed to load replies:', error);
      setComments(prev =>
        prev.map(c => (c.id === comment.id ? { ...c, loadingReplies: false } : c))
      );
    }
  };

  // ------- LIKE HANDLER (OPTIMISTIC) -------
  const handleLikeComment = async (
    comment: CommentWithReplies,
    isReply: boolean,
    parentId?: string
  ) => {
    const optimisticLiked = !comment.likedByCurrentUser;
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
                  likedByCurrentUser: optimisticLiked,
                  totalLike: optimisticLikes,
                }
                : r
            ),
          };
        })
      );
    } else {
      setComments(prev =>
        prev.map(c =>
          c.id === comment.id
            ? {
              ...c,
              likedByCurrentUser: optimisticLiked,
              totalLike: optimisticLikes,
            }
            : c
        )
      );
    }

    try {
      const result = await postCommentService.toggleLikeComment(postId, comment.id);

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
                    likedByCurrentUser: result.liked,
                    totalLike: result.totalLikes,
                  }
                  : r
              ),
            };
          })
        );
      } else {
        setComments(prev =>
          prev.map(c =>
            c.id === comment.id
              ? {
                ...c,
                likedByCurrentUser: result.liked,
                totalLike: result.totalLikes,
              }
              : c
          )
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
              replies: c.replies?.map(r => (r.id === comment.id ? { ...r, ...comment } : r)),
            };
          })
        );
      } else {
        setComments(prev => prev.map(c => (c.id === comment.id ? { ...c, ...comment } : c)));
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
      likedByCurrentUser: false,
      isPosting: true,
    };

    setCommentText('');
    setReplyingTo(null);
    setRootIDToReply(null);

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
        })
      );
      // optimistic increment total comment count for replies
      onCommentChange?.(1);
    } else {
      setComments(prev => [tempComment, ...prev]);
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      // optimistic increment total comment count for new root comment
      onCommentChange?.(1);
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
                : r
            );
            return {
              ...c,
              replies: updatedReplies,
            };
          })
        );
      } else {
        setComments(prev =>
          prev.map(c =>
            c.id === tempId ? ({ ...(newComment as CommentWithReplies) } as CommentWithReplies) : c
          )
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
          })
        );
        // revert optimistic increment
        onCommentChange?.(-1);
      } else {
        setComments(prev => prev.filter(c => c.id !== tempId));
        // revert optimistic increment
        onCommentChange?.(-1);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputFocus = () => {
    scrollTo(SNAP_TOP);
  };

  // ------- LONG PRESS HANDLER -------
  const handleLongPressItem = (
    comment: CommentWithReplies,
    layout: { x: number; y: number; width: number; height: number }
  ) => {
    if (!currentUser) return;

    setSelectedComment(comment);
    setSelectedLayout(layout);
  };

  // ------- DELETE COMMENT -------

  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current && deletedRef.current) {
        clearTimeout(undoTimeoutRef.current);
        const { comment } = deletedRef.current;
        postCommentService.deleteComment(postId, comment.id).catch(err => console.error(err));
      }
    };
  }, [postId]);

  const handleUndoDelete = () => {
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }

    const pending = deletedRef.current;
    if (!pending) return;

    const { comment, isReply, parentId } = pending;

    if (isReply && parentId) {
      setComments(prev =>
        prev.map(c => {
          if (c.id !== parentId) return c;

          const currentReplies = c.replies || [];
          if (currentReplies.find(r => r.id === comment.id)) return c;

          const restoredReplies = [...currentReplies, comment].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );

          return {
            ...c,
            replies: restoredReplies,
            totalReply: (c.totalReply || 0) + 1,
          };
        })
      );
    } else {
      setComments(prev => {
        if (prev.find(c => c.id === comment.id)) return prev;

        const restoredList = [comment, ...prev].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        return restoredList;
      });
    }

    setToastVisible(false);
    deletedRef.current = null;
  };

  const handleDeleteComment = (
    comment: CommentWithReplies,
    isReply: boolean,
    parentId?: string
  ) => {
    setSelectedComment(null);
    setSelectedLayout(null);
    Keyboard.dismiss();

    if (undoTimeoutRef.current && deletedRef.current) {
      clearTimeout(undoTimeoutRef.current);
      const prevItem = deletedRef.current;
      postCommentService.deleteComment(postId, prevItem.comment.id).catch(console.error);
    }

    deletedRef.current = { comment, isReply, parentId };

    if (isReply && parentId) {
      setComments(prev =>
        prev.map(c => {
          if (c.id !== parentId) return c;
          return {
            ...c,
            replies: c.replies?.filter(r => r.id !== comment.id),
            totalReply: Math.max(0, (c.totalReply || 0) - 1),
          };
        })
      );
    } else {
      setComments(prev => prev.filter(c => c.id !== comment.id));
    }

    showToast('Đã xóa bình luận.', 'undo', 'bottom');

    undoTimeoutRef.current = setTimeout(async () => {
      try {
        await postCommentService.deleteComment(postId, comment.id);
        deletedRef.current = null;
        undoTimeoutRef.current = null;
      } catch (error) {
        console.error('Delete failed', error);
        handleUndoDelete();
      }
    }, 4000);
  };

  // ------- PIN COMMENT HANDLER -------
  const [unpinModalVisible, setUnpinModalVisible] = useState(false);
  const [commentToUnpin, setCommentToUnpin] = useState<CommentWithReplies | null>(null);

  const handlePinComment = async (comment: CommentWithReplies) => {
    if (comment.pinned) {
      setCommentToUnpin(comment);
      setUnpinModalVisible(true);
    } else {
      const pinnedCount = comments.filter(c => c.pinned).length;
      if (pinnedCount >= 2) {
        showToast('Giới hạn là 2 bình luận', 'info', 'center');
        return;
      }
      await performPin(comment);
    }
  };

  const confirmUnpin = async () => {
    if (commentToUnpin) {
      setUnpinModalVisible(false);
      await performPin(commentToUnpin);
      setCommentToUnpin(null);
    }
  };

  const performPin = async (comment: CommentWithReplies) => {
    const isPinning = !comment.pinned;
    showToast(isPinning ? 'Đang ghim bình luận...' : 'Đang bỏ ghim...', 'loading', 'center', 0);

    try {
      await postCommentService.togglePinComment(postId, comment.id);
      setPage(0);
      setComments([]);
      await loadComments(0);
      setToastVisible(false);
    } catch (error) {
      console.error('Failed to pin comment', error);
      showToast('Có lỗi xảy ra khi ghim bình luận.', 'info', 'center');
    }
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
    opacity: interpolate(translateY.value, [SNAP_HALF, SNAP_CLOSE], [1, 0], Extrapolation.CLAMP),
  }));

  const muteOverlayStyle = useAnimatedStyle(() => {
    const sheetTop = translateY.value;
    const iconTop = sheetTop - 40;

    return {
      top: iconTop,
      opacity: interpolate(translateY.value, [SNAP_HALF, SNAP_CLOSE], [1, 0], Extrapolation.CLAMP),
    };
  });

  const renderCommentItem = ({ item }: { item: CommentWithReplies }) => (
    <View style={styles.commentBlock}>
      <CommentItemWrapper
        comment={item}
        rootComment={item}
        onLike={handleLikeComment}
        onReply={handleReply}
        onToggleReplies={handleToggleReplies}
        onLongPress={handleLongPressItem}
        isFocused={selectedComment?.id === item.id}
      />

      {item.loadingReplies && (
        <View style={{ paddingLeft: 48, paddingVertical: 10 }}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}

      {item.showReplies &&
        item.replies &&
        item.replies.map((reply, index) => (
          <View key={`reply-${reply.id}-${index}`}>
            <CommentItemWrapper
              comment={reply}
              rootComment={item}
              isReply={true}
              onLike={handleLikeComment}
              onReply={handleReply}
              onToggleReplies={handleToggleReplies}
              onLongPress={handleLongPressItem}
              isFocused={selectedComment?.id === reply.id}
            />
          </View>
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
        <Animated.View style={[styles.backdrop, backdropStyle]} pointerEvents="box-none">
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleClose}
          />
        </Animated.View>

        {onToggleMute && (
          <Animated.View style={[styles.muteOverlayButton, muteOverlayStyle]}>
            <Pressable onPress={onToggleMute} hitSlop={10}>
              <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={20} color="#fff" />
            </Pressable>
          </Animated.View>
        )}

        <Animated.View style={[styles.modalContent, rStyle]}>
          <GestureDetector gesture={panGesture}>
            <View style={{ flex: 1 }}>
              <CommentHeader title="Bình luận" />

              <View style={{ flex: 1 }}>
                <View style={styles.listWrapper}>
                  <GestureDetector gesture={nativeGesture}>
                    <Animated.FlatList
                      ref={flatListRef as any}
                      data={comments}
                      renderItem={renderCommentItem}
                      keyExtractor={(item: CommentWithReplies, index) => `${item.id}-${index}`}
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

          <CommentInput
            commentText={commentText}
            onChangeText={setCommentText}
            onSend={handleSendComment}
            onFocus={handleInputFocus}
            inputRef={inputRef}
            userAvatar={currentUser?.avatar}
            replyingTo={replyingTo}
            onCancelReply={handleCancelReply}
            submitting={submitting}
          />
        </Animated.View>

        <CommentActionMenu
          visible={!!selectedComment}
          comment={selectedComment}
          layout={selectedLayout}
          currentUserId={currentUser?.id}
          postAuthorId={postAuthorId}
          onClose={() => {
            setSelectedComment(null);
            setSelectedLayout(null);
          }}
          onDelete={handleDeleteComment}
          onPin={handlePinComment}
          onReport={comment => console.log('Báo cáo', comment.id)}
          onBlock={comment => console.log('Chặn', comment.author.id)}
        />

        {toastVisible && (
          <Toast
            visible={toastVisible}
            message={toastMessage}
            onUndo={handleUndoDelete}
            onHide={() => setToastVisible(false)}
            type={toastConfig.type}
            position={toastConfig.position}
            duration={toastConfig.duration}
          />
        )}

        {/* Loading Overlay for Pinning */}

        {/* Unpin Confirmation Modal */}
        <UnpinCommentModal
          visible={unpinModalVisible}
          onConfirm={confirmUnpin}
          onCancel={() => setUnpinModalVisible(false)}
        />
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
  muteOverlayButton: {
    position: 'absolute',
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 18,
    padding: 8,
    zIndex: 50,
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
});
