import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../../components/common/Avatar';

export default function NotesScreen() {
  const { theme } = useTheme();
  const { user: currentUser } = useAuth();
  const router = useRouter();

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
        Ghi chú
      </Text>
      <View style={styles.placeholder} />
    </View>
  );

  const renderComingSoon = () => (
    <View style={styles.comingSoonContainer}>
      <View style={styles.iconContainer}>
        <View style={styles.noteIconContainer}>
          <Avatar 
            uri={currentUser?.profile?.avatar} 
            name={currentUser?.username} 
            size={60} 
          />
        </View>
      </View>
      <Text style={[styles.comingSoonTitle, { color: theme.colors.text }]}>
        Coming Soon
      </Text>
      <Text style={[styles.comingSoonDescription, { color: theme.colors.textSecondary }]}>
        Tính năng ghi chú sẽ sớm được ra mắt. Bạn sẽ có thể tạo và chia sẻ ghi chú với bạn bè!
      </Text>
      <TouchableOpacity 
        style={[styles.backToMessagesButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => router.back()}
      >
        <Text style={styles.backToMessagesText}>Quay lại tin nhắn</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <SafeAreaView style={styles.safeArea}>
        {renderHeader()}
        {renderComingSoon()}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 32, // Same width as back button to center the title
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 24,
  },
  noteIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E3F2FD',
    borderWidth: 3,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  noteEmoji: {
    fontSize: 32,
  },
  comingSoonTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  comingSoonDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  backToMessagesButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backToMessagesText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
