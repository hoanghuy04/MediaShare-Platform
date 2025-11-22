import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type CommentHeaderProps = {
    title?: string;
};

export const CommentHeader = ({ title = 'Bình luận' }: CommentHeaderProps) => {
    return (
        <View style={styles.dragHandleArea}>
            <View style={styles.handleBarContainer}>
                <View style={styles.handleBar} />
            </View>
            <Text style={styles.headerTitle}>{title}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    dragHandleArea: {
        backgroundColor: '#fff',
        paddingBottom: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: '#eee',
        zIndex: 10,
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
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        textAlign: 'center',
        marginBottom: 12,
    },
});
