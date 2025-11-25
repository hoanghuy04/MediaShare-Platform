import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    StyleSheet,
    Animated,
    Dimensions,
    TouchableWithoutFeedback,
    PanResponder,
} from 'react-native';
import { FollowerUserResponse } from '../../types/user';
import { Avatar } from '../common/Avatar';
import { Theme } from '../../styles/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DISMISS_THRESHOLD = 120;

interface RemoveFollowerModalProps {
    visible: boolean;
    follower: FollowerUserResponse | null;
    theme: Theme;
    onClose: () => void;
    onConfirm: () => void;
}

export const RemoveFollowerModal: React.FC<RemoveFollowerModalProps> = ({
    visible,
    follower,
    theme,
    onClose,
    onConfirm,
}) => {
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const panY = useRef(new Animated.Value(0)).current;

    const translateY = Animated.add(slideAnim, panY);

    useEffect(() => {
        if (visible) {
            panY.setValue(0);

            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    friction: 8,
                    tension: 65,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: SCREEN_HEIGHT,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible, fadeAnim, slideAnim, panY]);

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
            onPanResponderMove: (_, g) => {
                if (g.dy > 0) {
                    panY.setValue(g.dy);
                }
            },
            onPanResponderRelease: (_, g) => {
                if (g.dy > DISMISS_THRESHOLD) {
                    Animated.parallel([
                        Animated.timing(slideAnim, {
                            toValue: SCREEN_HEIGHT,
                            duration: 250,
                            useNativeDriver: true,
                        }),
                        Animated.timing(fadeAnim, {
                            toValue: 0,
                            duration: 250,
                            useNativeDriver: true,
                        }),
                    ]).start(() => {
                        panY.setValue(0);
                        onClose();
                    });
                } else {
                    Animated.spring(panY, {
                        toValue: 0,
                        useNativeDriver: true,
                        friction: 8,
                        tension: 65,
                    }).start();
                }
            },
        })
    ).current;

    if (!visible && !follower) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <Animated.View
                    style={[styles.modalOverlay, { opacity: fadeAnim }]}
                >
                    <TouchableWithoutFeedback>
                        <Animated.View
                            {...panResponder.panHandlers}
                            style={[
                                styles.bottomSheetContent,
                                {
                                    backgroundColor: theme.colors.background,
                                    transform: [{ translateY }],
                                },
                            ]}
                        >
                            <View
                                style={[
                                    styles.modalHandle,
                                    { backgroundColor: '#D0D0D0' },
                                ]}
                            />

                            <View style={styles.contentContainer}>
                                <View style={styles.infoRow}>
                                    <Avatar
                                        uri={follower?.avatarUrl}
                                        name={follower?.username}
                                        size={52}
                                        style={styles.avatar}
                                    />
                                    <View style={styles.textBlock}>
                                        <Text
                                            style={[
                                                styles.title,
                                                { color: theme.colors.text },
                                            ]}
                                        >
                                            Xóa người theo dõi?
                                        </Text>
                                        <Text
                                            style={[
                                                styles.message,
                                                { color: theme.colors.gray },
                                            ]}
                                        >
                                            Sudo sẽ không cho{' '}
                                            {follower?.username} biết rằng bạn
                                            đã xóa họ khỏi danh sách người theo
                                            dõi mình.
                                        </Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={styles.removeButton}
                                    onPress={onConfirm}
                                >
                                    <Text style={styles.removeButtonText}>
                                        Gỡ
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    </TouchableWithoutFeedback>
                </Animated.View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    bottomSheetContent: {
        width: '100%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 8,
        paddingBottom: 16,
        paddingHorizontal: 0,
    },
    modalHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 12,
    },
    contentContainer: {
        paddingHorizontal: 16,
        paddingBottom: 4,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    avatar: {
        marginRight: 12,
    },
    textBlock: {
        flex: 1,
    },
    title: {
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 6,
    },
    message: {
        fontSize: 14,
        lineHeight: 20,
    },
    removeButton: {
        paddingVertical: 12,
    },
    removeButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#FF3B30',
    },
});
