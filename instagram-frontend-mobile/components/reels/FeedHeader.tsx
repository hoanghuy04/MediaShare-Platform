import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

type TabType = 'reels' | 'friends';

interface FeedHeaderProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const FeedHeader = ({ currentTab, onTabChange }: FeedHeaderProps) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity onPress={() => onTabChange('reels')}>
          <Text style={[styles.tabText, currentTab === 'reels' && styles.activeText]}>Reels</Text>
        </TouchableOpacity>

        <View style={styles.separator} />

        <TouchableOpacity onPress={() => onTabChange('friends')}>
          <Text style={[styles.tabText, currentTab === 'friends' && styles.activeText]}>
            Bạn bè
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.cameraIcon}>
        <Ionicons name="camera" size={28} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default FeedHeader;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 0 : 5,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 8 : 8,
  },
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 15,
  },
  tabText: {
    color: 'rgb(255, 255, 255)',
    fontSize: 30,
    fontWeight: '600',
  },
  activeText: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
  },
  separator: {
    width: 1,
    height: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  cameraIcon: {
    position: 'absolute',
    right: 20,
    top: Platform.OS === 'android' ? 40 : 10,
  },
});
