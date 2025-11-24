import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

type Props = {
  visible: boolean;
};

export const ReadReceiptLabel: React.FC<Props> = ({ visible }) => {
  const { theme } = useTheme();

  if (!visible) {
    return null;
  }

  return (
    <Text
      style={[
        styles.readReceiptLabel,
        { color: theme.colors.textSecondary },
      ]}
    >
      Đã xem
    </Text>
  );
};

const styles = StyleSheet.create({
  readReceiptLabel: {
    fontSize: 11,
    marginTop: 2,
    marginRight: 16,
    textAlign: 'right',
  },
});

