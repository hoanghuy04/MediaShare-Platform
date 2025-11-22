import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    runOnJS,
    Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ToastDeleteCommentProps = {
    visible: boolean;
    message: string;
    onUndo?: () => void;
    onHide: () => void;
};

export const ToastDeleteComment = ({
    visible,
    message,
    onUndo,
    onHide,
}: ToastDeleteCommentProps) => {
    const insets = useSafeAreaInsets();

    const opacity = useSharedValue(0);
    const translateY = useSharedValue(20);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
    }));

    useEffect(() => {
        if (visible) {
            opacity.value = withTiming(1, { duration: 300 });
            translateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.quad) });

            const timeout = setTimeout(() => {
                hideToast();
            }, 4000);

            return () => clearTimeout(timeout);
        }
    }, [visible]);

    const hideToast = () => {
        opacity.value = withTiming(0, { duration: 300 });
        translateY.value = withTiming(20, { duration: 300 }, (finished) => {
            if (finished) {
                runOnJS(onHide)();
            }
        });
    };

    if (!visible) return null;

    const bottomPosition = insets.bottom + 20;

    return (
        <Animated.View
            style={[
                styles.container,
                { bottom: bottomPosition },
                animatedStyle,
            ]}
        >
            <Text style={styles.text}>{message}</Text>

            {onUndo && (
                <Pressable onPress={onUndo} hitSlop={10} style={styles.undoButton}>
                    <Text style={styles.undoText}>Hoàn tác</Text>
                </Pressable>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 16,
        right: 16,
        backgroundColor: '#2C2F34',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',

        zIndex: 9999,
        elevation: 99,

        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
    },
    text: {
        color: '#fff',
        fontSize: 14,
        flex: 1,
    },
    undoButton: {
        marginLeft: 12,
        paddingLeft: 12,
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(255,255,255,0.2)',
    },
    undoText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
});