import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';

const { width, height: screenHeight } = Dimensions.get('window');

const ReelSkeleton = ({ height }: { height: number }) => {
    const opacity = new Animated.Value(0.5);

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.5,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();

        return () => animation.stop();
    }, []);

    return (
        <View style={[styles.container, { height: height || screenHeight }]}>
            <View style={styles.content}>
                <View style={styles.rightSide}>
                    <Animated.View style={[styles.iconCircle, { opacity }]} />
                    <Animated.View style={[styles.iconCircle, { opacity }]} />
                    <Animated.View style={[styles.iconCircle, { opacity }]} />
                </View>
                <View style={styles.bottomInfo}>
                    <View style={styles.row}>
                        <Animated.View style={[styles.avatar, { opacity }]} />
                        <Animated.View style={[styles.username, { opacity }]} />
                    </View>
                    <Animated.View style={[styles.description, { opacity }]} />
                    <Animated.View style={[styles.descriptionShort, { opacity }]} />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: width,
        backgroundColor: '#1c1c1c', // Lighter than black to be visible
        justifyContent: 'flex-end',
        paddingBottom: 20,
    },
    content: {
        padding: 15,
        justifyContent: 'flex-end',
        height: '100%',
    },
    rightSide: {
        position: 'absolute',
        right: 10,
        bottom: 100,
        alignItems: 'center',
        gap: 20,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#333',
        marginBottom: 15,
    },
    bottomInfo: {
        marginBottom: 40,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#333',
        marginRight: 10,
    },
    username: {
        width: 100,
        height: 14,
        borderRadius: 4,
        backgroundColor: '#333',
    },
    description: {
        width: '70%',
        height: 14,
        borderRadius: 4,
        backgroundColor: '#333',
        marginBottom: 8,
    },
    descriptionShort: {
        width: '40%',
        height: 14,
        borderRadius: 4,
        backgroundColor: '#333',
    },
});

export default ReelSkeleton;
