import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import ReelsCreationScreen from './reels/ReelsCreationScreen';

const { width } = Dimensions.get('window');

type TabType = 'post' | 'story' | 'reels';

export const CreateTabbedFlow: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('reels');

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'post':
        return (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Post Creation Coming Soon...</Text>
          </View>
        );
      case 'story':
        return (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Story Creation Coming Soon...</Text>
          </View>
        );
      case 'reels':
        return <ReelsCreationScreen />;
      default:
        return <ReelsCreationScreen />;
    }
  };

  // --- header trên cùng: IG thực tế không show header khi quay Reels,
  // nên mình ẩn header nếu activeTab === 'reels' để không đè lên giao diện camera ---
  const renderTopHeader = () => {
    // Reels không có header vì ReelsCreationScreen tự có nút close
    return null;
  };

  // --- thanh chọn tab dưới cùng ---
  const renderBottomTabs = () => {
    return (
      <View style={styles.bottomSegmentedControl}>
        {/* BÀI VIẾT */}
        <TouchableOpacity
          style={[styles.bottomTab, activeTab === 'post' && styles.activeBottomTab]}
          onPress={() => setActiveTab('post')}
        >
          <Text style={[styles.bottomTabText, activeTab === 'post' && styles.activeBottomTabText]}>
            BÀI VIẾT
          </Text>
        </TouchableOpacity>

        {/* TIN */}
        <TouchableOpacity
          style={[styles.bottomTab, activeTab === 'story' && styles.activeBottomTab]}
          onPress={() => setActiveTab('story')}
        >
          <Text style={[styles.bottomTabText, activeTab === 'story' && styles.activeBottomTabText]}>
            TIN
          </Text>
        </TouchableOpacity>

        {/* THƯỚC PHIM */}
        <TouchableOpacity
          style={[styles.bottomTab, activeTab === 'reels' && styles.activeBottomTab]}
          onPress={() => setActiveTab('reels')}
        >
          <Text style={[styles.bottomTabText, activeTab === 'reels' && styles.activeBottomTabText]}>
            THƯỚC PHIM
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <View style={styles.contentContainer}>{renderContent()}</View>

      {renderBottomTabs()}
    </View>
  );
};

// --- styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  // HEADER
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    // đẩy xuống một chút để tránh notch / statusbar trên iOS
    paddingTop: Platform.select({
      ios: 50,
      android: 20,
      default: 20,
    }),

    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#000',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1a1a1a',
    zIndex: 20,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // CONTENT
  contentContainer: {
    flex: 1,
    backgroundColor: '#000',
  },

  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },

  placeholderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
  },

  // BOTTOM TABS
  bottomSegmentedControl: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: Platform.select({
      ios: 28,
      android: 16,
      default: 16,
    }),
  },

  bottomTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },

  activeBottomTab: {
    borderBottomWidth: 2,
    borderBottomColor: 'white',
  },

  bottomTabText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  activeBottomTabText: {
    color: 'white',
  },
});
