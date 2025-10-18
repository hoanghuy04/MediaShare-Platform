import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@hooks/useTheme';
import { useAuth } from '@hooks/useAuth';
import { Header } from '@components/common/Header';
import { ChatMessage } from '@components/messages/ChatMessage';
import { MessageInput } from '@components/messages/MessageInput';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { messageAPI } from '@services/api';
import { Message, Conversation } from '@types';
import { showAlert } from '@utils/helpers';

export default function ConversationScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConversation();
    loadMessages();
  }, [conversationId]);

  const loadConversation = async () => {
    try {
      const data = await messageAPI.getConversation(conversationId);
      setConversation(data);
    } catch (error: any) {
      showAlert('Error', error.message);
      router.back();
    }
  };

  const loadMessages = async () => {
    try {
      const response = await messageAPI.getMessages(conversationId);
      setMessages(response.data.reverse()); // Reverse to show oldest first
    } catch (error: any) {
      showAlert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    try {
      const newMessage = await messageAPI.sendMessage({
        conversationId,
        content,
      });
      setMessages([...messages, newMessage]);
    } catch (error: any) {
      showAlert('Error', error.message);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <ChatMessage message={item} isOwn={item.senderId === user?.id} />
  );

  if (isLoading || !conversation) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Header showBack />
        <LoadingSpinner />
      </View>
    );
  }

  const otherParticipant = conversation.participants.find(p => p.id !== user?.id);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      keyboardVerticalOffset={0}
    >
      <Header showBack title={otherParticipant?.username || 'Chat'} />
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

