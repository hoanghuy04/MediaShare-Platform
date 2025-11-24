import React from 'react';
import { FlatList, StyleSheet, View, Text, ActivityIndicator, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Message } from '../../types';
import { ConnectionStatus } from './ConnectionStatus';

type Props = {
  messages: Message[];
  renderMessage: (info: { item: Message; index: number }) => React.ReactNode;
  onEndReached: () => void;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  isLoadingMore: boolean;
  canUseRealtime: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'reconnecting';
  theme: any;
  flatListRef?: React.RefObject<FlatList<Message>>;
};

export const MessageList: React.FC<Props> = ({
  messages,
  renderMessage,
  onEndReached,
  onScroll,
  isLoadingMore,
  canUseRealtime,
  connectionStatus,
  theme,
  flatListRef,
}) => {
  return (
    <FlatList
      ref={flatListRef}
      data={messages}
      renderItem={renderMessage}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.messagesList}
      keyboardShouldPersistTaps="handled"
      onScroll={onScroll}
      scrollEventThrottle={16}
      inverted={false}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      contentInsetAdjustmentBehavior="never"
      automaticallyAdjustContentInsets={false}
      ListHeaderComponent={
        <>
          {isLoadingMore && (
            <View style={styles.loadingMore}>
              <ActivityIndicator
                size="small"
                color={theme.colors.primary}
              />
              <Text
                style={[
                  styles.loadingText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Đang tải tin nhắn cũ hơn...
              </Text>
            </View>
          )}
          {canUseRealtime &&
            connectionStatus !== 'connected' && (
              <ConnectionStatus
                status={connectionStatus}
                onRetry={() => {}}
              />
            )}
        </>
      }
      ListFooterComponent={<View style={styles.listFooter} />}
    />
  );
};

const styles = StyleSheet.create({
  messagesList: {
    paddingRight: 6,
    paddingLeft: 36,
    paddingTop: 8,
    paddingBottom: 64,
  },
  listFooter: { height: 40 },
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
  },
});

