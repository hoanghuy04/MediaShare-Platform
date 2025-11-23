import React, { useCallback } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
    interpolate,
    Extrapolation,
    Easing,
    useAnimatedReaction,
} from 'react-native-reanimated';
import { AntDesign, Ionicons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const SNAP_TOP = 0;
const SNAP_HALF = SCREEN_HEIGHT * 0.65;
const SNAP_CLOSE = SCREEN_HEIGHT;

interface OptionsModalProps {
    visible: boolean;
    onClose: () => void;
    onDelete: () => void;
    isOwner?: boolean;
    onFullScreen?: () => void;
}

const OptionsModal = ({ visible, onClose, onDelete, isOwner = false, onFullScreen }: OptionsModalProps) => {
    const translateY = useSharedValue(SNAP_CLOSE);
    const context = useSharedValue({ y: 0 });

    useAnimatedReaction(
        () => visible,
        (isVisible) => {
            if (isVisible) {
                translateY.value = SNAP_CLOSE;
                translateY.value = withSpring(SNAP_HALF, {
                    damping: 50,
                    stiffness: 300,
                    mass: 1,
                    overshootClamping: true,
                });
            }
        },
        [visible]
    );

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
            const { velocityY } = event;
            const currentY = translateY.value;

            if (velocityY > 1000) {
                handleClose();
            } else if (velocityY < -1000) {
                scrollTo(SNAP_HALF);
            } else {
                if (currentY > (SNAP_HALF + SNAP_CLOSE) / 2) {
                    handleClose();
                } else {
                    scrollTo(SNAP_HALF);
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
                [SNAP_HALF, SNAP_CLOSE],
                [1, 0],
                Extrapolation.CLAMP
            ),
        };
    });

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
                        </View>

                        <View style={styles.optionsContainer}>
                            <TouchableOpacity style={styles.optionItem} onPress={() => {
                                onFullScreen?.();
                                onClose();
                            }}>
                                <AntDesign name="expand" size={24} color="black" />
                                <Text style={styles.optionText}>Xem toàn màn hình</Text>
                            </TouchableOpacity>
                            {isOwner && (
                                <TouchableOpacity style={styles.optionItem} onPress={onDelete}>
                                    <Ionicons name="trash-outline" size={24} color="#ff3040" />
                                    <Text style={[styles.optionText, { color: '#ff3040' }]}>Xóa</Text>
                                </TouchableOpacity>
                            )}

                        </View>
                    </Animated.View>
                </GestureDetector>
            </GestureHandlerRootView>
        </Modal>
    );
};

export default OptionsModal;

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
    optionsContainer: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        gap: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: '#eee',
    },
    optionText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000',
    },
});
