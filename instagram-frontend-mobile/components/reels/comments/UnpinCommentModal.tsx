import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../../styles/colors';

type Props = {
    visible: boolean;
    onConfirm: () => void;
    onCancel: () => void;
};

export const UnpinCommentModal = ({ visible, onConfirm, onCancel }: Props) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View style={styles.confirmModalOverlay}>
                <View style={styles.confirmModalContent}>
                    <Text style={styles.confirmTitle}>Bỏ ghim bình luận?</Text>
                    <View style={styles.confirmDivider} />
                    <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={onConfirm}
                    >
                        <Text style={[styles.confirmButtonText, { color: colors.primary, fontWeight: '700' }]}>
                            Bỏ ghim
                        </Text>
                    </TouchableOpacity>
                    <View style={styles.confirmDivider} />
                    <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={onCancel}
                    >
                        <Text style={styles.confirmButtonText}>Hủy</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    confirmModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmModalContent: {
        backgroundColor: '#fff',
        borderRadius: 14,
        width: '70%',
        alignItems: 'center',
        overflow: 'hidden',
    },
    confirmTitle: {
        fontSize: 16,
        fontWeight: '600',
        paddingVertical: 20,
        color: '#000',
    },
    confirmDivider: {
        height: 0.5,
        width: '100%',
        backgroundColor: '#dbdbdb',
    },
    confirmButton: {
        width: '100%',
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmButtonText: {
        fontSize: 16,
        color: '#000',
    },
});
