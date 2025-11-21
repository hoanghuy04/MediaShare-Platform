import React, { useEffect, useState } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { Feather, Ionicons, Octicons } from '@expo/vector-icons';
import { PostLikeUserResponse } from '../../types/post.type';
import { postLikeService } from '../../services/post-like.service';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../styles/colors';

interface PostLikesModalProps {
    visible: boolean;
    onClose: () => void;
    postId: string;
    totalLikes: number;
    onVisibilityChange?: (visible: boolean) => void;
}

const PostLikesModal = ({ visible, onClose, postId, totalLikes, onVisibilityChange }: PostLikesModalProps) => {
    const [likes, setLikes] = useState<PostLikeUserResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { user: currentUser } = useAuth();

    useEffect(() => {
        if (visible) {
            loadLikes();
            onVisibilityChange?.(true);
        } else {
            onVisibilityChange?.(false);
        }
    }, [visible, postId]);

    const loadLikes = async () => {
        setLoading(true);
        try {
            const response = await postLikeService.getPostLikes(postId, 0, 20);
            console.log('content nè', response.content)
            setLikes(response.content || []);
        } catch (error) {
            console.error('Failed to load likes:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLikes = likes.filter((like) =>
        like.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderLikeItem = ({ item }: { item: PostLikeUserResponse }) => {
        const isCurrentUser = item.id === currentUser?.id;

        return (
            <View style={styles.likeItem}>
                <Image
                    source={{ uri: item.avatarUrl || 'https://i.pravatar.cc/150?u=1' }}
                    style={styles.avatar}
                />
                <View style={styles.userInfo}>
                    <Text style={styles.username}>{item.username}</Text>
                    <Text style={styles.name}>{item.username}</Text>
                </View>
                {!isCurrentUser && (
                    <TouchableOpacity style={styles.followButton}>
                        <Text style={styles.followButtonText}>Theo dõi</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}>
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={onClose}>
                <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                    {/* Handle bar */}
                    <View style={styles.handleBar} />

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Lượt thích và lượt phát</Text>
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Feather name="heart" size={24} color="black" />
                                <Text style={styles.statText}>{totalLikes.toLocaleString()}</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Octicons name="eye" size={24} color="black" />
                                <Text style={styles.statText}>0</Text>
                            </View>
                        </View>
                    </View>

                    {/* Search bar */}
                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Tìm kiếm"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor="#999"
                        />
                    </View>

                    {/* List */}
                    {loading ? (
                        <ActivityIndicator size="large" color="#000" style={styles.loader} />
                    ) : (
                        <FlatList
                            data={filteredLikes}
                            renderItem={renderLikeItem}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

export default PostLikesModal;

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '50%',
        paddingBottom: 20,
    },
    handleBar: {
        width: 40,
        height: 4,
        backgroundColor: '#ddd',
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 16,
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        textAlign: 'center',
        marginBottom: 12,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statText: {
        fontSize: 14,
        color: '#000',
        fontWeight: '500',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        marginHorizontal: 20,
        marginTop: 16,
        marginBottom: 12,
        paddingHorizontal: 12,
        height: 40,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#000',
    },
    loader: {
        marginTop: 40,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingTop: 8,
    },
    likeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f0f0f0',
    },
    userInfo: {
        flex: 1,
        marginLeft: 12,
    },
    username: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
        marginBottom: 2,
    },
    name: {
        fontSize: 13,
        color: '#666',
    },
    followButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 8,
    },
    followButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});
