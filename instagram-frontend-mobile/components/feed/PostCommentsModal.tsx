import React from 'react';
import CommentsModal from '../reels/CommentsModal';

interface PostCommentsModalProps {
  visible: boolean;
  onClose: () => void;
  postId: string;
  postAuthorId: string;
}

/**
 * Wrapper around reels CommentsModal for use in feed PostCard
 * Reuses all the comment logic from reels
 */
export const PostCommentsModal: React.FC<PostCommentsModalProps> = ({
  visible,
  onClose,
  postId,
  postAuthorId,
}) => {
  return (
    <CommentsModal
      visible={visible}
      onClose={onClose}
      postId={postId}
      postAuthorId={postAuthorId}
    />
  );
};
