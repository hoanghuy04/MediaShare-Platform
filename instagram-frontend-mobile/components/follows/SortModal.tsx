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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../styles/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export type SortOption = 'newest' | 'oldest';

interface SortModalProps {
    visible: boolean;
    sortOption: SortOption;
    theme: Theme;
    onClose: () => void;
    onSelect: (option: SortOption) => void;
}

export const SortModal: React.FC<SortModalProps> = ({
    visible,
    sortOption,
    theme,
    onClose,
    onSelect,
}) => {
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                friction: 8,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: SCREEN_HEIGHT,
                duration: 250,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback>
                        <Animated.View
                            style={[
                                styles.modalContent,
                                {
                                    transform: [{ translateY: slideAnim }],
                                    backgroundColor: theme.colors.background,
                                },
                            ]}
                        >
                            <View style={[styles.modalHandle, { backgroundColor: theme.colors.gray }]} />
                            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Sắp xếp theo</Text>

                            <TouchableOpacity
                                style={styles.sortOptionItem}
                                onPress={() => onSelect('newest')}
                            >
                                <Text style={[styles.sortOptionText, { color: theme.colors.text }]}>Mới nhất</Text>
                                {sortOption === 'newest' && (
                                    <Ionicons name="checkmark-circle" size={24} color={theme.colors.text} />
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.sortOptionItem}
                                onPress={() => onSelect('oldest')}
                            >
                                <Text style={[styles.sortOptionText, { color: theme.colors.text }]}>Ngày cũ nhất</Text>
                                {sortOption === 'oldest' && (
                                    <Ionicons name="checkmark-circle" size={24} color={theme.colors.text} />
                                )}
                            </TouchableOpacity>
                        </Animated.View>
                    </TouchableWithoutFeedback>
                </View>
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
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 16,
        paddingBottom: 32,
        paddingTop: 8,
    },
    modalHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 24,
    },
    sortOptionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
    },
    sortOptionText: {
        fontSize: 16,
    },
});
