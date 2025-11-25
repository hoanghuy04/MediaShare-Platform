import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    Pressable,
} from 'react-native';
import { FlatList, Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    Easing,
    useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { Avatar } from '../common/Avatar';
import { userService } from '../../services/user.service';
import { UserSummaryResponse } from '../../types/user';
import { useAuth } from '../../context/AuthContext';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const SNAP_TOP = 0;
const SNAP_HALF = SCREEN_HEIGHT * 0.5;
const SNAP_CLOSE = SCREEN_HEIGHT;

type ShareModalProps = {
    visible: boolean;
    onClose: () => void;
    postId: string;
};

export const ShareModal: React.FC<ShareModalProps> = ({ visible, onClose, postId }) => {
    const insets = useSafeAreaInsets();
    const { user: currentUser } = useAuth();

    const [searchQuery, setSearchQuery] = useState('');
    const [mutualFollows, setMutualFollows] = useState<UserSummaryResponse[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);

    const translateY = useSharedValue(SNAP_CLOSE);
    const context = useSharedValue({ y: 0 });
    const scrollY = useSharedValue(0);
    const touchStart = useSharedValue(0);

    const flatListRef = useRef<FlatList<UserSummaryResponse>>(null);

    const onScroll = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    // Load mutual follows
    const loadMutualFollows = async (query = '') => {
        if (!currentUser?.id) return;

        setLoading(true);
        try {
            const result = await userService.getMutualFollows(currentUser.id, query, 0, 20);
            setMutualFollows(result);
        } catch (error) {
            console.error('Failed to load mutual follows:', error);
            setMutualFollows([]);
        } finally {
            setLoading(false);
        }
    };

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

    useEffect(() => {
        if (visible) {
            translateY.value = SNAP_CLOSE;
            setTimeout(() => {
                scrollTo(SNAP_HALF);
            }, 50);
            setSelectedUsers(new Set());
            setSearchQuery('');
            loadMutualFollows();
        } else {
            translateY.value = SNAP_CLOSE;
        }
    }, [visible]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (visible) {
                loadMutualFollows(searchQuery);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const closeSheet = useCallback(() => {
        'worklet';
        translateY.value = withTiming(
            SNAP_CLOSE,
            {
                duration: 250,
                easing: Easing.out(Easing.quad),
            },
            (finished) => {
                if (finished) {
                    scheduleOnRN(onClose);
                }
            }
        );
    }, [onClose, translateY]);

    const handleClose = useCallback(() => {
        closeSheet();
    }, [closeSheet]);

    const handleToggleUser = (userId: string) => {
        setSelectedUsers((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(userId)) {
                newSet.delete(userId);
            } else {
                newSet.add(userId);
            }
            return newSet;
        });
    };

    const handleSend = async () => {
        if (selectedUsers.size === 0) return;

        setSending(true);
        try {
            // TODO: Implement send to users API
            console.log('Sending post to users:', Array.from(selectedUsers));

            // Show success message
            await new Promise(resolve => setTimeout(resolve, 500));
            closeSheet();
        } catch (error) {
            console.error('Failed to send:', error);
        } finally {
            setSending(false);
        }
    };

    // Pan gesture similar to CommentsModal
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
        .onUpdate((event) => {
            const effectiveTop = insets.top;
            let newY = context.value.y + event.translationY;
            if (newY < effectiveTop) newY = effectiveTop;
            translateY.value = newY;
        })
        .onEnd((event) => {
            const effectiveTop = insets.top;
            if (event.translationY > 100 || event.velocityY > 500) {
                closeSheet();
            } else if (event.translationY < -50 || event.velocityY < -500) {
                scrollTo(effectiveTop);
            } else {
                if (translateY.value < SNAP_HALF / 2) {
                    scrollTo(effectiveTop);
                } else {
                    scrollTo(SNAP_HALF);
                }
            }
        });

    const composedGesture = Gesture.Simultaneous(nativeGesture, panGesture);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    const backdropOpacity = useAnimatedStyle(() => ({
        opacity: visible ? 1 - (translateY.value / SNAP_CLOSE) : 0,
    }));

    const renderUserItem = ({ item }: { item: UserSummaryResponse }) => (
        <View style={styles.userCard}>
            <TouchableOpacity
                onPress={() => handleToggleUser(item.id)}
                activeOpacity={0.7}
                style={styles.userCardInner}
            >
                <View style={styles.userAvatarContainer}>
                    <Avatar
                        uri={item.profile?.avatar}
                        name={item.username}
                        size={64}
                    />
                    {selectedUsers.has(item.id) && (
                        <View style={styles.checkmarkContainer}>
                            <Ionicons name="checkmark-circle" size={24} color="#4D5DF7" />
                        </View>
                    )}
                </View>
                <Text style={styles.userName} numberOfLines={1}>
                    {item.username}
                </Text>
            </TouchableOpacity>
        </View>
    );

    const renderHeader = () => (
        <View>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputWrapper}>
                    <Ionicons name="search" size={18} color="#8e8e8e" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm kiếm"
                        placeholderTextColor="#8e8e8e"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={18} color="#8e8e8e" />
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity style={styles.settingsButton}>
                    <MaterialCommunityIcons name="tune-variant" size={20} color="#000" />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderEmpty = () => {
        if (loading) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4D5DF7" />
                </View>
            );
        }
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Không tìm thấy người dùng</Text>
            </View>
        );
    };

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={handleClose}
            statusBarTranslucent
        >
            <GestureHandlerRootView style={{ flex: 1 }}>
                <View style={styles.modalContainer}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={handleClose}>
                        <Animated.View style={[styles.backdrop, backdropOpacity]} />
                    </Pressable>

                    <GestureDetector gesture={composedGesture}>
                        <Animated.View
                            style={[
                                styles.sheetContainer,
                                {
                                    height: SCREEN_HEIGHT,
                                    paddingBottom: insets.bottom || 20,
                                },
                                animatedStyle,
                            ]}
                        >
                            {/* Handle */}
                            <View style={styles.handleContainer}>
                                <View style={styles.handle} />
                            </View>

                            {/* Header */}
                            <View style={styles.header}>
                                <Text style={styles.title}>Gửi</Text>
                                <TouchableOpacity
                                    style={styles.closeButton}
                                    onPress={handleClose}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Ionicons name="close" size={28} color="#000" />
                                </TouchableOpacity>
                            </View>

                            {/* Content */}
                            <FlatList
                                ref={flatListRef}
                                data={mutualFollows}
                                renderItem={renderUserItem}
                                keyExtractor={(item) => item.id}
                                numColumns={3}
                                ListHeaderComponent={renderHeader}
                                ListEmptyComponent={renderEmpty}
                                onScroll={onScroll}
                                scrollEventThrottle={16}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.flatListContent}
                                columnWrapperStyle={styles.columnWrapper}
                            />

                            {/* Footer Actions */}
                            <View style={styles.footer}>
                                {selectedUsers.size > 0 ? (
                                    <View style={styles.sendContainer}>
                                        <Text style={styles.sendLabel}>Soạn tin nhắn...</Text>
                                        <TouchableOpacity
                                            style={[styles.sendButton, sending && styles.sendButtonDisabled]}
                                            onPress={handleSend}
                                            disabled={sending}
                                        >
                                            {sending ? (
                                                <ActivityIndicator size="small" color="#fff" />
                                            ) : (
                                                <Text style={styles.sendButtonText}>Gửi</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View style={styles.actionButtons}>
                                        <TouchableOpacity style={styles.actionButton}>
                                            <View style={[styles.actionIconContainer, { backgroundColor: '#0084FF' }]}>
                                                <FontAwesome5 name="facebook-messenger" size={24} color="#fff" />
                                            </View>
                                            <Text style={styles.actionLabel}>Messenger</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity style={styles.actionButton}>
                                            <View style={[styles.actionIconContainer, { backgroundColor: '#E5E5E5' }]}>
                                                <Ionicons name="add-circle-outline" size={28} color="#000" />
                                            </View>
                                            <Text style={styles.actionLabel}>Thêm vào tin</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity style={styles.actionButton}>
                                            <View style={[styles.actionIconContainer, { backgroundColor: '#E5E5E5' }]}>
                                                <Ionicons name="link-outline" size={28} color="#000" />
                                            </View>
                                            <Text style={styles.actionLabel}>Sao chép liên kết</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity style={styles.actionButton}>
                                            <View style={[styles.actionIconContainer, { backgroundColor: '#000' }]}>
                                                <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>𝕏</Text>
                                            </View>
                                            <Text style={styles.actionLabel}>X</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity style={styles.actionButton}>
                                            <View style={[styles.actionIconContainer, { backgroundColor: '#25D366' }]}>
                                                <FontAwesome5 name="whatsapp" size={24} color="#fff" />
                                            </View>
                                            <Text style={styles.actionLabel}>WhatsApp</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </Animated.View>
                    </GestureDetector>
                </View>
            </GestureHandlerRootView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    sheetContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: 'hidden',
    },
    handleContainer: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: '#C7C7CC',
        borderRadius: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#EFEFEF',
        position: 'relative',
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000',
    },
    closeButton: {
        position: 'absolute',
        right: 16,
        top: 8,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
    },
    searchInputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F2F2F2',
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 36,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#000',
    },
    settingsButton: {
        padding: 8,
    },
    flatListContent: {
        paddingBottom: 20,
    },
    columnWrapper: {
        paddingHorizontal: 8,
    },
    loadingContainer: {
        paddingVertical: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyContainer: {
        paddingVertical: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: '#8e8e8e',
    },
    userCard: {
        width: SCREEN_WIDTH / 3,
        paddingHorizontal: 8,
        paddingVertical: 12,
    },
    userCardInner: {
        alignItems: 'center',
    },
    userAvatarContainer: {
        position: 'relative',
        marginBottom: 8,
    },
    checkmarkContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#fff',
        borderRadius: 12,
    },
    userName: {
        fontSize: 12,
        color: '#000',
        textAlign: 'center',
        maxWidth: '100%',
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: '#EFEFEF',
        paddingHorizontal: 16,
        paddingTop: 12,
        backgroundColor: '#fff',
    },
    sendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 12,
    },
    sendLabel: {
        fontSize: 14,
        color: '#8e8e8e',
        flex: 1,
    },
    sendButton: {
        backgroundColor: '#4D5DF7',
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 8,
        minWidth: 80,
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#B0B0B0',
    },
    sendButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingBottom: 12,
    },
    actionButton: {
        alignItems: 'center',
        width: 70,
    },
    actionIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    actionLabel: {
        fontSize: 11,
        color: '#000',
        textAlign: 'center',
    },
});
