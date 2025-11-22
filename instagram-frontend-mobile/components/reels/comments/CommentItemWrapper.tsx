import React, { useRef } from 'react';
import { View } from 'react-native';
import { CommentRow, CommentData } from './CommentRow';


type WrapperProps = {
    comment: CommentData;
    rootComment: CommentData;
    isReply?: boolean;
    isFocused: boolean;
    onLike: (comment: CommentData, isReply: boolean, parentId?: string) => void;
    onReply: (comment: CommentData, rootComment: CommentData) => void;
    onToggleReplies?: (comment: CommentData) => void;
    onLongPress: (
        comment: CommentData,
        layout: { x: number; y: number; width: number; height: number }
    ) => void;
};

export const CommentItemWrapper = ({
    comment,
    rootComment,
    isReply = false,
    isFocused,
    onLike,
    onReply,
    onToggleReplies,
    onLongPress,
}: WrapperProps) => {
    const containerRef = useRef<View>(null);

    const handleLongPressWrapper = () => {
        containerRef.current?.measureInWindow((x, y, width, height) => {
            onLongPress(comment, { x, y, width, height });
        });
    };

    return (
        <View style={{ opacity: isFocused ? 0 : 1 }}>
            <CommentRow
                containerRef={containerRef}
                comment={comment}
                rootComment={rootComment}
                isReply={isReply}
                onLike={onLike}
                onReply={onReply}
                onToggleReplies={onToggleReplies}
                onLongPress={handleLongPressWrapper}
            />
        </View>
    );
};