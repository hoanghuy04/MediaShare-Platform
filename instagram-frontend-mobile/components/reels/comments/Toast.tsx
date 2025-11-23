import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    runOnJS,
    Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ToastType = 'undo' | 'info' | 'loading';
type ToastPosition = 'bottom' | 'center';

type ToastProps = {
    visible: boolean;
    message: string;
    onUndo?: () => void;
    onHide: () => void;
    type?: ToastType;
    position?: ToastPosition;
    duration?: number;
};

export const Toast = ({
    visible,
    message,
    onUndo,
    onHide,
    type = 'info',
    position = 'bottom',
    duration = 4000,
}: ToastProps) => {
    const insets = useSafeAreaInsets();
    const { height, width } = Dimensions.get('window');

    const opacity = useSharedValue(0);
    const translateY = useSharedValue(20);

    const animatedStyle = useAnimatedStyle(() => {
        const style: any = {
            opacity: opacity.value,
        };
        if (position === 'bottom') {
            style.transform = [{ translateY: translateY.value }];
        }
        return style;
    });

    useEffect(() => {
        if (visible) {
            opacity.value = withTiming(1, { duration: 300 });
            if (position === 'bottom') {
                translateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.quad) });
            }

            if (duration > 0) {
                const timeout = setTimeout(() => {
                    hideToast();
                }, duration);
                return () => clearTimeout(timeout);
            }
        }
    }, [visible, duration, position]);

    const hideToast = () => {
        opacity.value = withTiming(0, { duration: 300 });
        if (position === 'bottom') {
            translateY.value = withTiming(20, { duration: 300 }, (finished) => {
                if (finished) {
                    runOnJS(onHide)();
                }
            });
        } else {
            setTimeout(() => {
                runOnJS(onHide)();
            }, 300);
        }
    };

    if (!visible) return null;

    const bottomPosition = insets.bottom + 20;

    const containerStyle = [
        styles.container,
        position === 'bottom'
            ? { bottom: bottomPosition, left: 16, right: 16 }
            : {
                top: height / 2 - 25,
                left: (width - 250) / 2,
                width: 250,
                justifyContent: 'center' as const,
            },
        animatedStyle,
    ];

    return (
        <Animated.View style={containerStyle}>
            {type === 'loading' && (
                <ActivityIndicator size="small" color="#fff" style={{ marginRight: 10 }} />
            )}

            <Text style={[styles.text, { textAlign: 'center' }]}>
                {message}
            </Text>

            {type === 'undo' && onUndo && (
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
        backgroundColor: '#8F8F8F',
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