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
    KeyboardAvoidingView,
    Platform,
    Keyboard,
} from 'react-native';
import { FlatList, Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    interpolate,
    Extrapolation,
    Easing,
    useAnimatedScrollHandler,
    useAnimatedReaction,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { Avatar } from '../common/Avatar'; // Giữ component Avatar của bạn
import { userService } from '../../services/user.service'; // Giữ service của bạn
import { UserSummaryResponse } from '../../types/user'; // Giữ type của bạn
import { useAuth } from '../../context/AuthContext';
import { messageAPI } from '../../services/message.service';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// Cấu hình Snap Points giống CommentsModal
const SNAP_TOP = 0;
const SNAP_HALF = SCREEN_HEIGHT * 0.4; // Cách top 40% -> Modal cao 60%
const SNAP_CLOSE = SCREEN_HEIGHT;

type ShareModalProps = {
    visible: boolean;
    onClose: () => void;
    postId: string;
};

export const ShareModal: React.FC<ShareModalProps> = ({ visible, onClose, postId }) => {
    const insets = useSafeAreaInsets();
    const { user: currentUser } = useAuth();

    // --- DATA STATE ---
    const [searchQuery, setSearchQuery] = useState('');
    const [mutualFollows, setMutualFollows] = useState<UserSummaryResponse[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [messageText, setMessageText] = useState('');

    // --- ANIMATION STATE ---
    const translateY = useSharedValue(SNAP_CLOSE);
    const context = useSharedValue({ y: 0 });
    const scrollY = useSharedValue(0);
    const touchStart = useSharedValue(0);

    const onScroll = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    // --- LOGIC LOAD DATA ---
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

    // --- ANIMATION HELPERS ---
    const scrollTo = useCallback((destination: number) => {
        'worklet';
        translateY.value = withSpring(destination, {
            damping: 50,
            stiffness: 300,
            mass: 1,
            overshootClamping: true,
        });
    }, [translateY]);

    const closeSheet = useCallback(() => {
        'worklet';
        translateY.value = withTiming(SNAP_CLOSE, {
            duration: 250,
            easing: Easing.out(Easing.quad),
        }, (finished) => {
            if (finished) scheduleOnRN(onClose);
        });
    }, [onClose, translateY]);

    const handleClose = useCallback(() => {
        Keyboard.dismiss();
        closeSheet();
    }, [closeSheet]);

    // --- EFFECTS ---
    useEffect(() => {
        if (visible) {
            translateY.value = SNAP_CLOSE;
            // Mở lên ở mức SNAP_HALF (giữa màn hình)
            setTimeout(() => scrollTo(SNAP_HALF), 50);

            setSelectedUsers(new Set());
            setSearchQuery('');
            setMessageText('');
            loadMutualFollows();
        } else {
            translateY.value = SNAP_CLOSE;
        }
    }, [visible]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (visible) loadMutualFollows(searchQuery);
        }, 300);
        return () => clearTimeout(timeout);
    }, [searchQuery]);

    // Keyboard Handling: Đẩy modal lên full khi gõ phím (Chỉ iOS)
    useEffect(() => {
        if (Platform.OS === 'ios') {
            const showEvent = 'keyboardWillShow';
            const sub = Keyboard.addListener(showEvent, () => scrollTo(SNAP_TOP));
            return () => sub.remove();
        }
    }, [scrollTo]);

    // --- ACTIONS ---
    const handleToggleUser = (userId: string) => {
        setSelectedUsers((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(userId)) newSet.delete(userId);
            else newSet.add(userId);
            return newSet;
        });
    };

    const handleSend = async () => {
        if (selectedUsers.size === 0) return;
        setSending(true);
        try {
            const users = Array.from(selectedUsers);
            await Promise.all(users.map(async (userId) => {
                // 1. Gửi tin nhắn chia sẻ bài viết
                await messageAPI.sendDirectMessage(userId, postId, 'POST_SHARE');

                // 2. Gửi tin nhắn văn bản (nếu có)
                if (messageText.trim()) {
                    await messageAPI.sendDirectMessage(userId, messageText.trim(), 'TEXT');
                }
            }));

            handleClose();
        } catch (error) {
            console.error('Failed to send messages:', error);
        } finally {
            setSending(false);
        }
    };

    // --- GESTURES ---
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
            } else if (scrollY.value <= 0) {
                if (deltaY > 5) stateManager.activate();
                else if (deltaY < -5) stateManager.fail();
            } else {
                stateManager.fail();
            }
        })
        .onStart(() => { context.value = { y: translateY.value }; })
        .onUpdate((event) => {
            const effectiveTop = insets.top;
            let newY = context.value.y + event.translationY;
            if (newY < effectiveTop) newY = effectiveTop;
            translateY.value = newY;
        })
        .onEnd((event) => {
            if (event.velocityY > 1000) {
                if (translateY.value > SNAP_HALF) closeSheet();
                else scrollTo(SNAP_HALF);
            } else if (event.velocityY < -1000) {
                scrollTo(SNAP_TOP);
            } else {
                if (translateY.value < SNAP_HALF / 2) scrollTo(SNAP_TOP);
                else if (translateY.value < (SNAP_HALF + SNAP_CLOSE) / 2) scrollTo(SNAP_HALF);
                else closeSheet();
            }
        });

    // --- STYLES ANIMATION ---
    // Key Logic: Animate HEIGHT thay vì TOP để giữ footer dính đáy
    const rStyle = useAnimatedStyle(() => ({
        height: SCREEN_HEIGHT - translateY.value,
    }));

    const backdropOpacity = useAnimatedStyle(() => ({
        opacity: interpolate(translateY.value, [SNAP_HALF, SNAP_CLOSE], [1, 0], Extrapolation.CLAMP),
    }));

    // --- RENDER HELPERS ---
    const renderUserItem = ({ item }: { item: UserSummaryResponse }) => (
        <View style={styles.userCard}>
            <TouchableOpacity
                onPress={() => handleToggleUser(item.id)}
                activeOpacity={0.7}
                style={styles.userCardInner}
            >
                <View style={styles.userAvatarContainer}>
                    <Avatar uri={item.profile?.avatar} name={item.username} size={64} />
                    {selectedUsers.has(item.id) && (
                        <View style={styles.checkmarkContainer}>
                            <Ionicons name="checkmark-circle" size={24} color="#4D5DF7" />
                        </View>
                    )}
                </View>
                <Text style={styles.userName} numberOfLines={1}>{item.username}</Text>
            </TouchableOpacity>
        </View>
    );

    const renderHeaderList = () => (
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
        </View>
    );

    if (!visible) return null;

    return (
        <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={handleClose}>
            <GestureHandlerRootView style={styles.modalOverlay}>
                {/* Backdrop */}
                <Animated.View style={[styles.backdrop, backdropOpacity]} pointerEvents="box-none">
                    <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
                </Animated.View>

                {/* Main Sheet */}
                <GestureDetector gesture={panGesture}>
                    <Animated.View style={[styles.modalContent, rStyle]}>

                        {/* 1. Header & Handle */}
                        <View style={styles.headerArea}>
                            <View style={styles.handleContainer}>
                                <View style={styles.handle} />
                            </View>
                            <View style={styles.headerTitleRow}>
                                <Text style={styles.headerTitle}>Gửi</Text>
                                <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                                    <Ionicons name="close" size={28} color="#000" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* 2. Body List (Scrollable) */}
                        <View style={styles.bodyWrapper}>
                            <GestureDetector gesture={nativeGesture}>
                                <FlatList
                                    data={mutualFollows}
                                    renderItem={renderUserItem}
                                    keyExtractor={(item) => item.id}
                                    numColumns={3}
                                    ListHeaderComponent={renderHeaderList}
                                    onScroll={onScroll}
                                    scrollEventThrottle={16}
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={styles.flatListContent}
                                    columnWrapperStyle={styles.columnWrapper}
                                    keyboardDismissMode="on-drag"
                                />
                            </GestureDetector>
                        </View>

                        {/* 3. Footer Input (Always at bottom) */}
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                            style={styles.footerWrapper}
                        >
                            <View style={[styles.footerContainer, { paddingBottom: insets.bottom || 12 }]}>
                                {selectedUsers.size > 0 ? (
                                    // Giao diện khi ĐÃ CHỌN người: Input tin nhắn + Nút Gửi
                                    <View style={styles.messageInputContainer}>
                                        <TextInput
                                            style={styles.messageInput}
                                            placeholder="Soạn tin nhắn..."
                                            placeholderTextColor="#8e8e8e"
                                            value={messageText}
                                            onChangeText={setMessageText}
                                        />
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
                                    // Giao diện khi CHƯA CHỌN người: Các nút Social Actions
                                    <View style={styles.socialActions}>
                                        <SocialButton icon="facebook-messenger" color="#0084FF" label="Messenger" type="fa5" />
                                        <SocialButton icon="add-circle-outline" color="#000" bg="#E5E5E5" label="Thêm vào tin" type="ion" />
                                        <SocialButton icon="link-outline" color="#000" bg="#E5E5E5" label="Sao chép" type="ion" />
                                        <SocialButton icon="whatsapp" color="#25D366" label="WhatsApp" type="fa5" />
                                    </View>
                                )}
                            </View>
                        </KeyboardAvoidingView>

                    </Animated.View>
                </GestureDetector>
            </GestureHandlerRootView>
        </Modal>
    );
};

// Helper Component cho nút Social
const SocialButton = ({ icon, color, bg, label, type }: any) => (
    <TouchableOpacity style={styles.actionButton}>
        <View style={[styles.actionIconContainer, { backgroundColor: bg || color }]}>
            {type === 'fa5' ? (
                <FontAwesome5 name={icon} size={24} color={bg ? color : "#fff"} />
            ) : (
                <Ionicons name={icon} size={28} color={bg ? color : "#fff"} />
            )}
        </View>
        <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end', // Đẩy modal xuống đáy
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        position: 'absolute',
        width: '100%',
        bottom: 0,
        overflow: 'hidden', // Quan trọng để bo góc
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    // HEADER AREA
    headerArea: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#EFEFEF',
        zIndex: 10,
    },
    handleContainer: { alignItems: 'center', paddingVertical: 10 },
    handle: { width: 40, height: 4, backgroundColor: '#C7C7CC', borderRadius: 2 },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingBottom: 10,
        position: 'relative',
    },
    headerTitle: { fontSize: 16, fontWeight: '700', color: '#000' },
    closeButton: { position: 'absolute', right: 16, top: -4 },

    // BODY AREA
    bodyWrapper: {
        flex: 1, // Chiếm toàn bộ khoảng trống còn lại
        backgroundColor: '#fff',
    },
    flatListContent: {
        paddingBottom: 20,
        paddingTop: 10,
    },
    columnWrapper: { paddingHorizontal: 8 },
    searchContainer: { paddingHorizontal: 16, marginBottom: 10 },
    searchInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F2F2F2',
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 36,
    },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 14, color: '#000' },

    // USER CARD
    userCard: { width: SCREEN_WIDTH / 3, paddingHorizontal: 8, paddingVertical: 12 },
    userCardInner: { alignItems: 'center' },
    userAvatarContainer: { position: 'relative', marginBottom: 8 },
    checkmarkContainer: {
        position: 'absolute', bottom: 0, right: 0, backgroundColor: '#fff', borderRadius: 12,
    },
    userName: { fontSize: 12, color: '#000', textAlign: 'center' },

    // FOOTER AREA
    footerWrapper: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#EFEFEF',
    },
    footerContainer: {
        paddingHorizontal: 16,
        paddingTop: 12,
    },

    // Message Input
    messageInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    messageInput: {
        flex: 1,
        height: 40,
        backgroundColor: '#F2F2F2',
        borderRadius: 20,
        paddingHorizontal: 16,
        fontSize: 14,
        color: '#000',
    },
    sendButton: {
        backgroundColor: '#4D5DF7',
        paddingHorizontal: 20,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonDisabled: { backgroundColor: '#B0B0B0' },
    sendButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },

    // Social Actions
    socialActions: { flexDirection: 'row', justifyContent: 'space-around' },
    actionButton: { alignItems: 'center', width: 70 },
    actionIconContainer: {
        width: 50, height: 50, borderRadius: 25,
        alignItems: 'center', justifyContent: 'center', marginBottom: 6,
    },
    actionLabel: { fontSize: 11, color: '#000', textAlign: 'center' },
});