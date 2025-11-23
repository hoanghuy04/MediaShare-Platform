import React, { RefObject } from 'react';
import {
    View,
    Text,
    TextInput,
    Image,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../styles/colors';
import { CommentData } from './CommentRow';

const EMOJIS = ['❤️', '🙌', '🔥', '👏', '😢', '😍', '😮', '😂'];

type CommentInputProps = {
    commentText: string;
    onChangeText: (text: string) => void;
    onSend: () => void;
    onFocus: () => void;
    inputRef: RefObject<TextInput>;
    userAvatar?: string;
    replyingTo?: CommentData | null;
    onCancelReply?: () => void;
    submitting?: boolean;
};

export const CommentInput = ({
    commentText,
    onChangeText,
    onSend,
    onFocus,
    inputRef,
    userAvatar,
    replyingTo,
    onCancelReply,
    submitting = false,
}: CommentInputProps) => {
    const isSendButtonActive = commentText.trim().length > 0;

    const handleSend = () => {
        const text = commentText.trim();
        if (!text || submitting) {
            return;
        }
        onSend();
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={0}
            style={styles.inputContainer}
        >
            {replyingTo && onCancelReply && (
                <View style={styles.replyBanner}>
                    <Text style={styles.replyText}>
                        Đang trả lời {replyingTo.author.username}
                    </Text>
                    <TouchableOpacity
                        onPress={onCancelReply}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="close" size={20} color="#666" />
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.emojiBar}>
                {EMOJIS.map((emoji, index) => (
                    <TouchableOpacity
                        key={index}
                        onPress={() => onChangeText(commentText + emoji)}
                        style={styles.emojiButton}
                    >
                        <Text style={styles.emojiText}>{emoji}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.inputRow}>
                <Image
                    source={{
                        uri: userAvatar || 'https://i.pravatar.cc/150?u=1',
                    }}
                    style={styles.inputAvatar}
                />
                <TextInput
                    ref={inputRef}
                    style={styles.input}
                    placeholder="Thêm bình luận..."
                    placeholderTextColor="#999"
                    value={commentText}
                    onChangeText={onChangeText}
                    multiline
                    onFocus={onFocus}
                />
                <TouchableOpacity
                    onPress={handleSend}
                    disabled={submitting}
                    style={styles.sendButton}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons
                        name="arrow-up-circle"
                        size={32}
                        color={
                            isSendButtonActive
                                ? colors.primary
                                : '#E0E0E0'
                        }
                    />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    inputContainer: {
        borderTopWidth: 1,
        borderTopColor: '#EFEFEF',
        backgroundColor: '#fff',
        paddingBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 20,
    },
    replyBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#f0f0f0',
        borderBottomWidth: 0.5,
        borderBottomColor: '#ddd',
    },
    replyText: {
        fontSize: 12,
        color: '#666',
    },
    emojiBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    emojiButton: {
        padding: 4,
    },
    emojiText: {
        fontSize: 24,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 12,
    },
    inputAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f0f0f0',
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#000',
        maxHeight: 100,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#dbdbdb',
        borderRadius: 24,
        backgroundColor: '#fafafa',
    },
    sendButton: {
        padding: 4,
        marginLeft: 4,
    },
});