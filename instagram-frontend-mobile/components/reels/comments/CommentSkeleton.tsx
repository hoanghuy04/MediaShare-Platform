import React from 'react';
import { View, StyleSheet } from 'react-native';

export const CommentSkeleton = () => (
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

const styles = StyleSheet.create({
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
