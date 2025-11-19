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
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

export type TabType = 'post' | 'story' | 'reels';

// Export BottomTabs component để sử dụng ở nơi khác
export interface BottomTabsProps {
  activeTab?: TabType;
  onTabPress?: (tab: TabType) => void;
}

export const BottomTabs: React.FC<BottomTabsProps> = ({ activeTab = 'post', onTabPress }) => {
  const handleTabPress = (tab: TabType) => {
    if (onTabPress) {
      onTabPress(tab);
    } else {
      // Default navigation nếu không có onTabPress
      switch (tab) {
        case 'post':
          router.push('/(tabs)/create/posts/pick-media');
          break;
        case 'story':
          // TODO: Implement story creation
          break;
        case 'reels':
          router.push('/(tabs)/create/reels');
          break;
      }
    }
  };

  return (
    <View style={styles.bottomSegmentedControl}>
      <TouchableOpacity
        style={[styles.bottomTab, activeTab === 'post' && styles.activeBottomTab]}
        onPress={() => handleTabPress('post')}
      >
        <Text style={[styles.bottomTabText, activeTab === 'post' && styles.activeBottomTabText]}>
          BÀI VIẾT
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.bottomTab, activeTab === 'story' && styles.activeBottomTab]}
        onPress={() => handleTabPress('story')}
      >
        <Text style={[styles.bottomTabText, activeTab === 'story' && styles.activeBottomTabText]}>
          TIN
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.bottomTab, activeTab === 'reels' && styles.activeBottomTab]}
        onPress={() => handleTabPress('reels')}
      >
        <Text style={[styles.bottomTabText, activeTab === 'reels' && styles.activeBottomTabText]}>
          THƯỚC PHIM
        </Text>
      </TouchableOpacity>
    </View>
  );
};

interface CreateTabbedFlowProps {
  onPostCreated?: () => void; 
}

export const CreateTabbedFlow: React.FC<CreateTabbedFlowProps> = ({ onPostCreated }) => {
  const [activeTab, setActiveTab] = useState<TabType | null>(null);
  const [postStep, setPostStep] = useState(1);

  const handleTabPress = (tab: TabType) => {
    setActiveTab(tab);
    
    // Chỉ navigate khi user click vào tab "BÀI VIẾT"
    if (tab === 'post') {
      router.push('/(tabs)/create/posts/pick-media');
    }
  };

  const handlePostStepChange = (step: number) => {
    setPostStep(step);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'post':
        // Không navigate tự động, chỉ hiển thị placeholder
        return (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>
              Nhấn "BÀI VIẾT" để bắt đầu tạo bài viết
            </Text>
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
        // Hiển thị màn hình mặc định khi chưa chọn tab
        return (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Chọn một tuỳ chọn tạo nội dung</Text>
          </View>
        );
    }
  };

  const renderBottomTabs = () => {
    return <BottomTabs activeTab={activeTab || 'post'} onTabPress={handleTabPress} />;
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <View style={styles.contentContainer}>{renderContent()}</View>

      {/* Luôn hiển thị bottom tabs */}
      {renderBottomTabs()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

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
