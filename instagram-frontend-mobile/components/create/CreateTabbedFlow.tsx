import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PostCreationScreen } from './post';
import { StoryCreationScreen } from './story';
import { ReelsCreationScreen } from './reels';

const { width } = Dimensions.get('window');

type TabType = 'post' | 'story' | 'reels';

export const CreateTabbedFlow: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('story');

  const renderContent = () => {
    switch (activeTab) {
      case 'post':
        return <PostCreationScreen />;
      case 'story':
        return <StoryCreationScreen />;
      case 'reels':
        return <ReelsCreationScreen />;
      default:
        return <StoryCreationScreen />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header - Only Close and Settings */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.closeButton}>
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={28} color="white" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>{renderContent()}</View>

      {/* Bottom Segmented Control */}
      <View style={styles.bottomSegmentedControl}>
        <TouchableOpacity
          style={[styles.bottomTab, activeTab === 'post' && styles.activeBottomTab]}
          onPress={() => setActiveTab('post')}
        >
          <Text style={[styles.bottomTabText, activeTab === 'post' && styles.activeBottomTabText]}>
            BÀI VIẾT
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bottomTab, activeTab === 'story' && styles.activeBottomTab]}
          onPress={() => setActiveTab('story')}
        >
          <Text style={[styles.bottomTabText, activeTab === 'story' && styles.activeBottomTabText]}>
            TIN
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bottomTab, activeTab === 'reels' && styles.activeBottomTab]}
          onPress={() => setActiveTab('reels')}
        >
          <Text style={[styles.bottomTabText, activeTab === 'reels' && styles.activeBottomTabText]}>
            THUỐC PHIM
          </Text>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#000',
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  bottomSegmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#000',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
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
