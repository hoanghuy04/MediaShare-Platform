import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  title: string;
  isGroup: boolean;
  onBack: () => void;
  onAddMember?: () => void;
  textColor: string;
};

export const SettingsHeader: React.FC<Props> = ({
  title,
  isGroup,
  onBack,
  onAddMember,
  textColor,
}) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.headerBtn} onPress={onBack}>
        <Ionicons name="arrow-back" size={24} color={textColor} />
      </TouchableOpacity>

      <Text style={[styles.headerTitle, { color: textColor }]}>
        {title}
      </Text>

      {isGroup ? (
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={onAddMember}
        >
          <Ionicons name="person-add-outline" size={24} color={textColor} />
        </TouchableOpacity>
      ) : (
        <View style={styles.headerBtn} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
  },
});

