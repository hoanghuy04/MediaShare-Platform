import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@hooks/useTheme';
import { useInfiniteScroll } from '@hooks/useInfiniteScroll';
import { Header } from '@components/common/Header';
import { ConversationList } from '@components/messages/ConversationList';
import { EmptyState } from '@components/common/EmptyState';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { messageAPI } from '@services/api';
import { showAlert } from '@utils/helpers';

export default function MessagesScreen() {
  const { theme } = useTheme();

  const {
    data: conversations,
    isLoading,
    refresh,
  } = useInfiniteScroll({
    fetchFunc: messageAPI.getConversations,
    limit: 20,
    onError: error => showAlert('Error', error.message),
  });

  useEffect(() => {
    refresh();
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Header title="Messages" />
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header title="Messages" rightIcon="create-outline" />
      {conversations?.length === 0 || !conversations ? (
        <EmptyState
          icon="chatbubbles-outline"
          title="No Messages"
          description="Start a conversation with your friends"
        />
      ) : (
        <ConversationList conversations={conversations} onRefresh={refresh} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

