import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PostResponse } from '../../types/post.type';

interface FeedFooterProps {
  data: PostResponse;
}

const FeedFooter = ({ data }: FeedFooterProps) => {
  const { author, caption } = data;

  const authorName = (author as any).fullName || (author as any).username || 'Unknown';
  const authorAvatar = (author as any).avatarUrl || 'https://i.pravatar.cc/150?u=1';

  return (
    <View style={styles.container}>
      <View style={styles.profileContainer}>
        <Image source={{ uri: authorAvatar }} style={styles.thumbnail} contentFit="cover" />
        <View style={styles.userInfo}>
          <View style={styles.userNameContainer}>
            <Text style={styles.nameStyle}>{authorName}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.followButton}>
          <Text style={styles.followText}>Theo dõi</Text>
        </TouchableOpacity>
      </View>

      <Text numberOfLines={2} style={styles.desc}>
        {caption || ''}
      </Text>

      {/* <View style={styles.friendsContainer}>
        {friends.map((item, index) => (
          <Image key={index} source={{ uri: item.imageUrl }} style={styles.friendImage} />
        ))}
        <Text style={styles.followInfo}>{`Followed by Akash and ${followerCount} others`}</Text>
      </View> */}
    </View>
  );
};

export default FeedFooter;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    marginLeft: 20,
    zIndex: 10,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  thumbnail: {
    width: 30,
    height: 30,
    borderRadius: 20,
    overflow: 'hidden',
  },
  userInfo: {
    marginLeft: 10,
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameStyle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 4,
  },
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  audioText: {
    color: '#fff',
    marginLeft: 6,
  },
  followButton: {
    marginLeft: 24,
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  followText: {
    color: '#fff',
  },
  desc: {
    color: '#fff',
    width: 300,
  },
  friendsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  friendImage: {
    width: 15,
    height: 15,
    borderRadius: 150,
    marginRight: -5,
  },
  followInfo: {
    color: '#fff',
    marginLeft: 13,
    fontSize: 12,
  },
});
