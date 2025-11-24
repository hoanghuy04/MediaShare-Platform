import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TypingIndicator } from './TypingIndicator';

type Props = {
  typingDisplayNames: string[];
};

export const TypingDock: React.FC<Props> = ({ typingDisplayNames }) => {
  if (typingDisplayNames.length === 0) {
    return null;
  }

  return (
    <View style={styles.typingDock}>
      <TypingIndicator
        isVisible
        multipleUsers={typingDisplayNames}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  typingDock: { paddingHorizontal: 16, paddingVertical: 4, minHeight: 24 },
});

