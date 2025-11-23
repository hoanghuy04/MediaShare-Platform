import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Entypo, Ionicons } from '@expo/vector-icons';
import { PostResponse } from '../../types/post.type';
import OptionsModal from './OptionsModal';
import { postService } from '../../services/post.service';
import ProcessingModal from '../common/ProcessingModal';
import { Toast } from './comments';
import { useAuth } from '../../context/AuthContext';

interface FeedSideBarProps {
  data: PostResponse;
  isLiked: boolean;
  onLike: () => void;
  onLikeCountPress?: () => void;
  onCommentPress?: () => void;
  onDeleteSuccess?: () => void;
  onFullScreen?: () => void;
}

const IconWithText = ({
  iconName,
  IconComponent = Ionicons,
  count,
  color = 'white',
  size = 28,
  onPress,
  onCountPress,
}: {
  iconName: any;
  IconComponent?: any;
  count?: number;
  color?: string;
  size?: number;
  onPress?: () => void;
  onCountPress?: () => void;
}) => (
  <View style={styles.iconContainer}>
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <IconComponent name={iconName} size={size} color={color} />
    </TouchableOpacity>
    <TouchableOpacity
      onPress={onCountPress}
      activeOpacity={0.7}
      style={styles.countButton}
    >
      <Text style={styles.countText}>{count}</Text>
    </TouchableOpacity>
  </View>
);

const FeedSideBar = ({ data, isLiked, onLike, onLikeCountPress, onCommentPress, onDeleteSuccess, onFullScreen }: FeedSideBarProps) => {
  const { totalLike, totalComment } = data;
  const [optionsVisible, setOptionsVisible] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [toastVisible, setToastVisible] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState('');
  const { user } = useAuth();
  const isOwner = user?.id === data.author.id;

  const handleDeletePost = async () => {
    setOptionsVisible(false);
    setIsDeleting(true);
    try {
      await postService.deletePost(data.id);
      setIsDeleting(false);
      setToastMessage('Đã xóa bài viết');
      setToastVisible(true);

      setTimeout(() => {
        onDeleteSuccess?.();
      }, 1000);
    } catch (error) {
      console.error('Failed to delete post:', error);
      setIsDeleting(false);
      setToastMessage('Có lỗi xảy ra khi xóa bài viết');
      setToastVisible(true);
    }
  };

  return (
    <View style={styles.container}>
      <IconWithText
        iconName={isLiked ? 'heart' : 'heart-outline'}
        count={totalLike}
        color={isLiked ? '#ff3040' : 'white'}
        onPress={onLike}
        onCountPress={onLikeCountPress}
      />
      <IconWithText
        iconName="chatbubble-outline"
        count={totalComment}
        onPress={onCommentPress}
        onCountPress={onCommentPress}
      />
      <IconWithText iconName="share-social-outline" count={0} />
      <IconWithText
        IconComponent={Entypo}
        iconName="dots-three-vertical"
        onPress={() => setOptionsVisible(true)}
      />

      <OptionsModal
        visible={optionsVisible}
        onClose={() => setOptionsVisible(false)}
        onDelete={handleDeletePost}
        isOwner={isOwner}
        onFullScreen={onFullScreen}
      />

      <ProcessingModal visible={isDeleting} message="Đang xóa" />

      <Toast
        visible={toastVisible}
        message={toastMessage}
        onHide={() => setToastVisible(false)}
        position="center"
      />
    </View>
  );
};

export default FeedSideBar;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'flex-end',
    alignItems: 'center',
    gap: 10,
    right: 20,
    zIndex: 10,
  },
  iconContainer: {
    alignItems: 'center',
  },
  countButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 2,
  },
  countText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  thumbnailContainer: {
    borderWidth: 3,
    borderColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbnail: {
    width: 24,
    height: 24,
    borderRadius: 8,
  },
});
