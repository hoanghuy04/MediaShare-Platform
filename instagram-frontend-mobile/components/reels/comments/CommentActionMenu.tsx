import React from 'react';
import { View, Text, StyleSheet, Pressable, TouchableOpacity, Image, Dimensions } from 'react-native';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { CommentData } from './CommentRow';
import { colors } from '../../../styles/colors';

type LayoutInfo = {
    x: number;
    y: number;
    width: number;
    height: number;
};

type CommentActionMenuProps = {
    visible: boolean;
    comment: CommentData | null;
    layout: LayoutInfo | null;
    currentUserId?: string;
    postAuthorId: string;
    onClose: () => void;
    onDelete: (comment: CommentData, isReply: boolean, parentId?: string) => void;
    onPin?: (comment: CommentData) => void;
    onReport?: (comment: CommentData) => void;
    onBlock?: (comment: CommentData) => void;
};

const renderTextWithMentions = (text: string) => {
    const mentionRegex = /(@[\w.]+)/g;
    const parts = text.split(mentionRegex);
    return (
        <Text style={styles.commentText}>
            {parts.map((part, index) => {
                if (part.match(mentionRegex)) {
                    return <Text key={index} style={styles.mentionText}>{part}</Text>;
                }
                return <Text key={index}>{part}</Text>;
            })}
        </Text>
    );
};

export const CommentActionMenu = ({
    visible,
    comment,
    layout,
    currentUserId,
    postAuthorId,
    onClose,
    onDelete,
    onPin,
    onReport,
    onBlock,
}: CommentActionMenuProps) => {
    if (!visible || !comment || !layout) return null;

    const isPostAuthor = currentUserId === postAuthorId;
    const isCommentAuthor = currentUserId === comment.author.id;
    const isTopLevelComment = !comment.parentCommentId;

    const SCREEN_HEIGHT = Dimensions.get('window').height;
    const MENU_HEIGHT = 150;
    const GAP = 10;
    const spaceBelow = SCREEN_HEIGHT - (layout.y + layout.height);
    const showBelow = spaceBelow > (MENU_HEIGHT + 50);

    const menuStyle: any = {
        position: 'absolute',
        left: 16,
        zIndex: 1000,
    };

    if (showBelow) {
        menuStyle.top = layout.y + layout.height + GAP;
    } else {
        menuStyle.bottom = (SCREEN_HEIGHT - layout.y) + GAP;
    }

    return (
        <View style={styles.actionMenuOverlay} pointerEvents="box-none">
            <View style={StyleSheet.absoluteFill}>
                <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.2)' }]} onPress={onClose} />
            </View>

            <View
                style={[
                    styles.highlightCommentCard,
                    {
                        top: layout.y,
                        left: layout.x,
                        width: layout.width,
                    },
                ]}
            >
                <View style={styles.highlightRow}>
                    <Image
                        source={{ uri: comment.author.avatarUrl || 'https://i.pravatar.cc/150?u=1' }}
                        style={styles.highlightAvatar}
                    />
                    <View style={{ flex: 1 }}>
                        <View style={styles.highlightHeader}>
                            <Text style={styles.highlightUsername}>{comment.author.username}</Text>
                            <Text style={styles.highlightTime}>
                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: vi })}
                            </Text>
                        </View>
                        {renderTextWithMentions(comment.text)}
                    </View>
                </View>
            </View>

            <View style={[styles.actionMenuContainer, menuStyle]}>

                {isPostAuthor ? (
                    <>
                        {isTopLevelComment && onPin && (
                            <TouchableOpacity style={styles.actionMenuItem} onPress={() => { onPin(comment); onClose(); }}>
                                <AntDesign name="pushpin" size={20} color="#262626" />
                                <Text style={styles.actionMenuText}>Ghim</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={styles.actionMenuItem}
                            onPress={() => {
                                const isReply = !!comment.parentCommentId;
                                onDelete(comment, isReply, comment.parentCommentId);
                            }}
                        >
                            <Ionicons name="trash-outline" size={20} color="#F6434E" />
                            <Text style={[styles.actionMenuText, { color: '#F6434E' }]}>Xóa</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        {isCommentAuthor ? (
                            <TouchableOpacity
                                style={styles.actionMenuItem}
                                onPress={() => {
                                    const isReply = !!comment.parentCommentId;
                                    onDelete(comment, isReply, comment.parentCommentId);
                                }}
                            >
                                <Ionicons name="trash-outline" size={20} color="#F6434E" />
                                <Text style={[styles.actionMenuText, { color: '#F6434E' }]}>Xóa</Text>
                            </TouchableOpacity>
                        ) : (
                            <>
                                {onReport && (
                                    <TouchableOpacity style={styles.actionMenuItem} onPress={() => { onReport(comment); onClose(); }}>
                                        <Ionicons name="alert-circle-outline" size={20} color="#262626" />
                                        <Text style={styles.actionMenuText}>Báo cáo</Text>
                                    </TouchableOpacity>
                                )}
                                {onBlock && (
                                    <TouchableOpacity style={styles.actionMenuItem} onPress={() => { onBlock(comment); onClose(); }}>
                                        <Ionicons name="ban-outline" size={20} color="#262626" />
                                        <Text style={styles.actionMenuText}>Chặn tài khoản</Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        )}
                    </>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    actionMenuOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 1000 },
    highlightCommentCard: {
        position: 'absolute',
        borderRadius: 12,
        backgroundColor: '#fff',
        padding: 8,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 5,
    },
    highlightRow: { flexDirection: 'row', alignItems: 'flex-start' },
    highlightAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12, backgroundColor: '#f0f0f0' },
    highlightHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    highlightUsername: { fontSize: 13, fontWeight: '600', color: '#000', marginRight: 6 },
    highlightTime: { fontSize: 11, color: '#888' },
    commentText: { fontSize: 14, color: '#000', lineHeight: 20 },
    mentionText: { color: colors.primary, fontWeight: '500' },

    actionMenuContainer: {
        position: 'absolute',
        backgroundColor: '#fff',
        borderRadius: 16,
        minWidth: 200,
        overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 8,
    },
    actionMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: '#EFEFEF'
    },
    actionMenuText: { fontSize: 15, color: '#262626', fontWeight: '500' },
});