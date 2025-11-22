import React, { useEffect, useState, useCallback } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    TextInput,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { FlatList, Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
    interpolate,
    Extrapolation,
    Easing,
} from 'react-native-reanimated';
import { Feather, Ionicons, Octicons } from '@expo/vector-icons';
import { PostLikeUserResponse } from '../../types/post.type';
import { postLikeService } from '../../services/post-like.service';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../styles/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const SNAP_TOP = 0;
const SNAP_HALF = SCREEN_HEIGHT * 0.4;
const SNAP_CLOSE = SCREEN_HEIGHT;

interface PostLikesModalProps {
    visible: boolean;
    onClose: () => void;
    postId: string;
    totalLikes: number;
}

const LikesModal = ({ visible, onClose, postId, totalLikes }: PostLikesModalProps) => {
    const [likes, setLikes] = useState<PostLikeUserResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { user: currentUser } = useAuth();

    const translateY = useSharedValue(SNAP_CLOSE);
    const context = useSharedValue({ y: 0 });

    useEffect(() => {
        if (visible) {
            translateY.value = SNAP_CLOSE;
            scrollTo(SNAP_HALF);
            loadLikes();
        } else {
            setSearchQuery('');
        }
    }, [visible, postId]);

    const loadLikes = async () => {
        setLoading(true);
        try {
            const response = await postLikeService.getPostLikes(postId, 0, 20);
            setLikes(response.content || []);
        } catch (error) {
            console.error('Failed to load likes:', error);
        } finally {
            setLoading(false);
        }
    };

    const scrollTo = useCallback((destination: number) => {
        'worklet';
        translateY.value = withSpring(destination, {
            damping: 50,
            stiffness: 300,
            mass: 1,
            overshootClamping: true,
        });
    }, []);

    const handleClose = useCallback(() => {
        'worklet';
        translateY.value = withTiming(SNAP_CLOSE, {
            duration: 250,
            easing: Easing.out(Easing.quad),
        }, (finished) => {
            if (finished) {
                runOnJS(onClose)();
            }
        });
    }, [onClose]);

    const gesture = Gesture.Pan()
        .onStart(() => {
            context.value = { y: translateY.value };
        })
        .onUpdate((event) => {
            let newY = event.translationY + context.value.y;

            if (newY < SNAP_TOP) {
                newY = SNAP_TOP + (newY - SNAP_TOP) * 0.2;
            }

            translateY.value = newY;
        })
        .onEnd((event) => {
            const { velocityY, translationY } = event;
            const currentY = translateY.value;

            if (velocityY > 1000) {
                if (currentY > SNAP_HALF + 100) {
                    handleClose();
                } else {
                    scrollTo(SNAP_HALF);
                }
            } else if (velocityY < -1000) {
                if (currentY < SNAP_HALF - 100) {
                    scrollTo(SNAP_TOP);
                } else {
                    scrollTo(SNAP_HALF);
                }
            } else {
                if (currentY < SNAP_HALF / 2) {
                    scrollTo(SNAP_TOP);
                } else if (currentY < (SNAP_HALF + SNAP_CLOSE) / 2) {
                    scrollTo(SNAP_HALF);
                } else {
                    handleClose();
                }
            }
        });

    const rStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: translateY.value }],
        };
    });

    const backdropStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(
                translateY.value,
                [SNAP_HALF, SNAP_CLOSE * 0.7],
                [1, 0],
                Extrapolation.CLAMP
            ),
        };
    });

    const renderLikeItem = ({ item }: { item: PostLikeUserResponse }) => {
        const isCurrentUser = item.id === currentUser?.id;

        return (
            <View style={styles.likeItem}>
                <Image
                    source={{ uri: item.avatarUrl || 'https://i.pravatar.cc/150?u=1' }}
                    style={styles.avatar}
                />
                <View style={styles.userInfo}>
                    <Text style={styles.username}>{item.username}</Text>
                    <Text style={styles.name}>{item.username}</Text>
                </View>
                {!isCurrentUser && (
                    <TouchableOpacity style={styles.followButton}>
                        <Text style={styles.followButtonText}>Theo dõi</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="none"
            statusBarTranslucent
            onRequestClose={() => runOnJS(handleClose)()}
        >
            <GestureHandlerRootView style={styles.modalOverlay}>
                <Animated.View style={[styles.backdrop, backdropStyle]} />
                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    activeOpacity={1}
                    onPress={() => runOnJS(handleClose)()}
                />

                <GestureDetector gesture={gesture}>
                    <Animated.View
                        style={[
                            styles.modalContent,
                            rStyle,
                            { height: SCREEN_HEIGHT }
                        ]}
                    >
                        <View style={styles.dragHandleArea}>
                            <View style={styles.handleBarContainer}>
                                <View style={styles.handleBar} />
                            </View>

                            <View style={styles.header}>
                                <Text style={styles.headerTitle}>Lượt thích và lượt phát</Text>
                                <View style={styles.statsRow}>
                                    <View style={styles.statItem}>
                                        <Feather name="heart" size={24} color="black" />
                                        <Text style={styles.statText}>{totalLikes.toLocaleString()}</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <Octicons name="eye" size={24} color="black" />
                                        <Text style={styles.statText}>0</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Tìm kiếm"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.listWrapper}>
                            {loading ? (
                                <ActivityIndicator size="large" color="#000" style={styles.loader} />
                            ) : (
                                <FlatList
                                    data={likes}
                                    renderItem={renderLikeItem}
                                    keyExtractor={(item) => item.id}
                                    contentContainerStyle={styles.listContent}
                                    showsVerticalScrollIndicator={false}
                                    ListFooterComponent={<View style={{ height: 150 }} />}
                                />
                            )}
                        </View>
                    </Animated.View>
                </GestureDetector>
            </GestureHandlerRootView>
        </Modal>
    );
};

export default LikesModal;

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        position: 'absolute',
        width: '100%',
        top: 0,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
        overflow: 'hidden',
    },
    dragHandleArea: {
        backgroundColor: '#fff',
        paddingBottom: 10,
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
    header: {
        paddingHorizontal: 20,
        paddingBottom: 6,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        textAlign: 'center',
        marginBottom: 12,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statText: {
        fontSize: 14,
        color: '#000',
        fontWeight: '500',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        marginHorizontal: 20,
        marginTop: 10,
        marginBottom: 12,
        paddingHorizontal: 12,
        height: 40,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#000',
        height: '100%',
    },
    listWrapper: {
        flex: 1,
        backgroundColor: '#fff',
    },
    listContent: {
        paddingHorizontal: 20,
    },
    loader: {
        marginTop: 40,
    },
    likeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f0f0f0',
    },
    userInfo: {
        flex: 1,
        marginLeft: 12,
    },
    username: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
    },
    name: {
        fontSize: 13,
        color: '#666',
    },
    followButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 8,
    },
    followButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});