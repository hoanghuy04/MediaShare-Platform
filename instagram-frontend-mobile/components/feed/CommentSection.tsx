import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Comment } from '@types';
import { useTheme } from '@hooks/useTheme';
import { Avatar } from '../common/Avatar';
import { formatDate } from '@utils/formatters';
import { Ionicons } from '@expo/vector-icons';

interface CommentSectionProps {
  comments: Comment[];
  onLikeComment?: (commentId: string) => Promise<boolean>;
  onDeleteComment?: (commentId: string) => void;
  onReplyComment?: (commentId: string, username: string) => void;
  onLoadReplies?: (commentId: string) => Promise<Comment[]>;
  currentUserId?: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  comments = [],
  onLikeComment,
  onDeleteComment,
  onReplyComment,
  onLoadReplies,
  currentUserId,
}) => {
  const { theme } = useTheme();
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [loadingReplies, setLoadingReplies] = useState<Set<string>>(new Set());
  const [repliesData, setRepliesData] = useState<Map<string, Comment[]>>(new Map());

  const handleLikeComment = async (commentId: string) => {
    if (!onLikeComment) return;
    
    try {
      // Call parent handler and get new like state
      const isLiked = await onLikeComment(commentId);
      
      // Update in repliesData if it's a nested comment
      setRepliesData(prev => {
        const newMap = new Map(prev);
        for (const [parentId, replies] of newMap.entries()) {
          const updatedReplies = replies.map(reply => 
            reply.id === commentId
              ? {
                  ...reply,
                  isLiked,
                  likesCount: isLiked ? reply.likesCount + 1 : Math.max(0, reply.likesCount - 1)
                }
              : reply
          );
          if (updatedReplies !== replies) {
            newMap.set(parentId, updatedReplies);
          }
        }
        return newMap;
      });
    } catch (error) {
      console.error('Error in handleLikeComment:', error);
    }
  };

  const toggleReplies = async (commentId: string) => {
    if (expandedReplies.has(commentId)) {
      const newExpanded = new Set(expandedReplies);
      newExpanded.delete(commentId);
      setExpandedReplies(newExpanded);
    } else {
      if (!repliesData.has(commentId)) {
        setLoadingReplies(prev => new Set(prev).add(commentId));
        try {
          const replies = await onLoadReplies!(commentId);
          setRepliesData(prev => new Map(prev).set(commentId, replies));
        } catch (error) {
          console.error('Error loading replies:', error);
        } finally {
          setLoadingReplies(prev => {
            const newSet = new Set(prev);
            newSet.delete(commentId);
            return newSet;
          });
        }
      }
      const newExpanded = new Set(expandedReplies);
      newExpanded.add(commentId);
      setExpandedReplies(newExpanded);
    }
  };

  const renderCommentText = (text: string, mention?: string) => {
    
    const parts = text.split(/(@\w+|#\w+)/g);
    
    return (
      <Text style={[styles.commentText, { color: theme.colors.text }]}>
        {parts.map((part, index) => {
          if (part.startsWith('@')) {
            return (
              <Text key={index} style={{ color: theme.colors.primary, fontWeight: '600' }}>
                {part}
              </Text>
            );
          }
          if (part.startsWith('#')) {
            return (
              <Text key={index} style={{ color: theme.colors.link, fontWeight: '500' }}>
                {part}
              </Text>
            );
          }
          return <Text key={index}>{part}</Text>;
        })}
      </Text>
    );
  };

  const renderComment = (item: Comment, isReply: boolean = false, level: number = 0) => {
    const hasReplies = (item.repliesCount || 0) > 0;
    const isExpanded = expandedReplies.has(item.id);
    const isLoadingReplies = loadingReplies.has(item.id);
    const replies = repliesData.get(item.id) || [];
    const leftMargin = level > 0 ? 40 : 0; // Only indent replies

    return (
      <View key={item.id} style={[styles.commentWrapper, { marginLeft: leftMargin }]}>
        <View style={styles.commentItem}>
          <Avatar uri={item.author.profile?.avatar} name={item.author.username} size={32} />

          <View style={styles.commentContent}>
            <View style={styles.textContainer}>
              <Text style={[styles.username, { color: theme.colors.text }]}>
                {item.author.username}
              </Text>
              <Text style={[styles.timestamp, { color: theme.colors.textSecondary }]}>
                {' '}{formatDate(item.createdAt)}
              </Text>
            </View>

            {renderCommentText(item.text, item.mention)}

            <View style={styles.commentActions}>
              <TouchableOpacity onPress={() => handleLikeComment(item.id)}>
                <Text style={[styles.actionText, { 
                  color: item.isLiked ? theme.colors.like : theme.colors.textSecondary,
                  fontWeight: item.isLiked ? '600' : '400'
                }]}>
                  {item.likesCount > 0 ? `${item.likesCount} thích` : 'Thích'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => onReplyComment?.(item.id, item.author.username)}>
                <Text style={[styles.actionText, { color: theme.colors.textSecondary }]}>
                  Trả lời
                </Text>
              </TouchableOpacity>

              {currentUserId === item.author.id && (
                <TouchableOpacity onPress={() => onDeleteComment?.(item.id)}>
                  <Text style={[styles.actionText, { color: theme.colors.danger }]}>
                    Xóa
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* View replies button */}
        {hasReplies && !isReply && (
          <TouchableOpacity 
            onPress={() => toggleReplies(item.id)}
            style={[styles.viewRepliesButton, { marginLeft: 44 }]}
          >
            {isLoadingReplies ? (
              <ActivityIndicator size="small" color={theme.colors.textSecondary} />
            ) : (
              <>
                <View style={[styles.replyLine, { backgroundColor: theme.colors.border }]} />
                <Text style={[styles.viewRepliesText, { color: theme.colors.textSecondary }]}>
                  {isExpanded ? '━━━ Ẩn phản hồi' : `━━━ Xem ${item.repliesCount} phản hồi`}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Render nested replies */}
        {isExpanded && replies.length > 0 && (
          <View style={styles.repliesContainer}>
            {replies.map(reply => renderComment(reply, true, level + 1))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.listContent}>
      {comments.map(comment => renderComment(comment, false, 0))}
    </View>
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingVertical: 8,
  },
  commentWrapper: {
    marginBottom: 16,
  },
  commentItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  commentContent: {
    flex: 1,
    marginLeft: 12,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  username: {
    fontSize: 13,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionText: {
    fontSize: 12,
  },
  viewRepliesButton: {
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  replyLine: {
    width: 24,
    height: 0.5,
  },
  viewRepliesText: {
    fontSize: 12,
    fontWeight: '600',
  },
  repliesContainer: {
    marginTop: 4,
  },
});
