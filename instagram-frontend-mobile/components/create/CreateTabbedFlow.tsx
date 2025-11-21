import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import PostCreationScreen from './posts/PostCreationScreen';
import ReelsCreationScreen from '@/app/create/reels/index';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabType = 'post' | 'story' | 'reels';

interface CreateTabbedFlowProps {
  onPostCreated?: () => void;
}

export const CreateTabbedFlow: React.FC<CreateTabbedFlowProps> = ({ onPostCreated }) => {
  const [activeTab, setActiveTab] = useState<TabType>('post');
  const [postStep, setPostStep] = useState(1);
  const [tabsHidden, setTabsHidden] = useState(false);

  const translateX = useSharedValue(0);

  const handleTabPress = (tab: TabType) => {
    setActiveTab(tab);
  };

  const handlePostStepChange = (step: number) => {
    setPostStep(step);
  };

  useEffect(() => {
    let targetIndex = 0;
    if (activeTab === 'story') targetIndex = 1;
    if (activeTab === 'reels') targetIndex = 2;

    translateX.value = withTiming(-targetIndex * SCREEN_WIDTH, {
      duration: 300,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });

    if (activeTab !== 'reels' && tabsHidden) {
      setTabsHidden(false);
    }
  }, [activeTab, tabsHidden]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const renderContent = () => {
    return (
      <Animated.View style={[styles.sliderContainer, animatedStyle]}>
        <View style={styles.screenPage}>
          <PostCreationScreen
            onClose={() => handleTabPress('story')}
            onStepChange={handlePostStepChange}
            onPostCreated={onPostCreated}
          />
        </View>

        <View style={styles.screenPage}>
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Story Creation Coming Soon...</Text>
          </View>
        </View>

        <View style={styles.screenPage}>
          <ReelsCreationScreen isFocused={activeTab === 'reels'} />
        </View>
      </Animated.View>
    );
  };

  const renderBottomTabs = () => {
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

  const shouldHideBottomTabs =
    tabsHidden || (activeTab === 'post' && (postStep === 2 || postStep === 3));

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <View style={styles.maskContainer}>{renderContent()}</View>

      {!shouldHideBottomTabs && renderBottomTabs()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  maskContainer: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  sliderContainer: {
    flex: 1,
    flexDirection: 'row',
    width: SCREEN_WIDTH * 3,
  },
  screenPage: {
    width: SCREEN_WIDTH,
    height: '100%',
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
    zIndex: 20,
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
