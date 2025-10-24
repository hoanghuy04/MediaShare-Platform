import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@hooks/useTheme';
import { useAuth } from '@hooks/useAuth';
import { Header } from '@components/common/Header';
import { ChatMessage } from '@components/messages/ChatMessage';
import { MessageInput } from '@components/messages/MessageInput';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { messageAPI } from '@services/api';
import { Message } from '@types';
import { showAlert } from '@utils/helpers';

export default function ConversationScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [otherUser, setOtherUser] = useState<any>(null);

  useEffect(() => {
    loadMessages();
  }, [conversationId]);

  const loadMessages = async () => {
    try {
      const response = await messageAPI.getMessages(conversationId);
      setMessages(response.content); 
      
      // Extract other user from messages
      if (response.content.length > 0) {
        const firstMessage = response.content[0];
        const other = firstMessage.sender.id === user?.id 
          ? firstMessage.receiver 
          : firstMessage.sender;
        setOtherUser(other);
      }
    } catch (error: any) {
      showAlert('Error', error.message);
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    try {
      const newMessage = await messageAPI.sendMessage({
        receiverId: conversationId, // conversationId is the other user's ID
        content,
      });
      setMessages([...messages, newMessage]);
    } catch (error: any) {
      showAlert('Error', error.message);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <ChatMessage message={item} isOwn={item.sender.id === user?.id} />
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Header showBack />
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      keyboardVerticalOffset={0}
    >
      <Header showBack title={otherUser?.username || 'Chat'} />
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesList}
        inverted={false}
      />
      <MessageInput onSend={handleSendMessage} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesList: {
    paddingVertical: 16,
  },
});
