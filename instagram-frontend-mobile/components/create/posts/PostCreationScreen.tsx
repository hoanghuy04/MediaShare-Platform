import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  ScrollView,
  TextInput,
  StatusBar,
  Platform,
  SafeAreaView,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@hooks/useTheme';
import { useAuth } from '@hooks/useAuth';
import { showAlert } from '@utils/helpers';
import { router } from 'expo-router';

import { GalleryPage } from './GalleryPage';
import { EditPage } from './EditPage';
import { SharePage } from './SharePage';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface PostCreationScreenProps {
  onClose: () => void;
  onStepChange?: (step: number) => void;
  onPostCreated?: () => void; // Callback để refresh feed
}

type GalleryAsset = {
  id: string;
  uri: string;
  mediaType: 'photo' | 'video';
  duration?: number;
};

export default function PostCreationScreen({ onClose, onStepChange, onPostCreated }: PostCreationScreenProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  
  // State management
  const [currentStep, setCurrentStep] = useState(1); // 1: Gallery, 2: Edit, 3: Share
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [gallery, setGallery] = useState<GalleryAsset[]>([]);
  const [hasMediaPermission, setHasMediaPermission] = useState<boolean | null>(null);
  const [loadingGallery, setLoadingGallery] = useState(true);
  
  // Animation refs
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Mock data for testing (thay thế cho MediaLibrary do iOS issue)
  // WARNING: Đây là mock data với URLs từ picsum.photos, không phải file thật
  // Khi upload, backend sẽ nhận được URL này thay vì file thật
  // TODO: Implement real MediaLibrary integration
  const mockGallery: GalleryAsset[] = [
    {
      id: '1',
      uri: 'https://picsum.photos/400/400?random=1',
      mediaType: 'photo',
    },
    {
      id: '2', 
      uri: 'https://picsum.photos/400/400?random=2',
      mediaType: 'photo',
    },
    {
      id: '3',
      uri: 'https://picsum.photos/400/400?random=3', 
      mediaType: 'video',
      duration: 15,
    },
    {
      id: '4',
      uri: 'https://picsum.photos/400/400?random=4',
      mediaType: 'photo', 
    },
    {
      id: '5',
      uri: 'https://picsum.photos/400/400?random=5',
      mediaType: 'photo',
    },
    {
      id: '6',
      uri: 'https://picsum.photos/400/400?random=6',
      mediaType: 'video',
      duration: 30,
    },
    {
      id: '7',
      uri: 'https://picsum.photos/400/400?random=7',
      mediaType: 'photo',
    },
    {
      id: '8',
      uri: 'https://picsum.photos/400/400?random=8',
      mediaType: 'photo',
    },
    {
      id: '9',
      uri: 'https://picsum.photos/400/400?random=9',
      mediaType: 'video',
      duration: 45,
    },
    {
      id: '10',
      uri: 'https://picsum.photos/400/400?random=10',
      mediaType: 'photo',
    },
    {
      id: '11',
      uri: 'https://picsum.photos/400/400?random=11',
      mediaType: 'photo',
    },
    {
      id: '12',
      uri: 'https://picsum.photos/400/400?random=12',
      mediaType: 'video',
      duration: 20,
    },
  ];

  // Initialize with mock data
  useEffect(() => {
    setGallery(mockGallery);
    setHasMediaPermission(true);
    setLoadingGallery(false);
  }, []);

  // Notify step changes
  useEffect(() => {
    onStepChange?.(currentStep);
  }, [currentStep, onStepChange]);

  // Handle media selection
  const handleMediaSelect = (id: string) => {
    setSelectedMedia(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  // Navigation functions
  const goToNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onClose();
    }
  };

  const handleShare = (data: any) => {
    showAlert('Success', 'Bài viết đã được chia sẻ!');
    onClose();
  };

  // Render Step 1: Gallery Selection
  const renderGalleryStep = () => (
    <GalleryPage
      height={screenHeight}
      gallery={gallery}
      loadingGallery={loadingGallery}
      selectedMedia={selectedMedia}
      onGoToCamera={onClose}
      onScrollBeginDrag={() => {}}
      onScroll={() => {}}
      onScrollEndDrag={() => {}}
      onSelectMedia={handleMediaSelect}
      onNext={goToNextStep}
    />
  );

  // Render Step 2: Edit & Preview
  const renderEditStep = () => (
    <EditPage
      height={screenHeight}
      selectedMedia={selectedMedia}
      gallery={gallery}
      onBack={goToPreviousStep}
      onNext={goToNextStep}
    />
  );

  // Render Step 3: Share
  const renderShareStep = () => (
    <SharePage
      selectedMedia={selectedMedia}
      gallery={gallery}
      onBack={goToPreviousStep}
      onShare={handleShare}
      hideTabbedFlow={true}
      onPostCreated={onPostCreated}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      {currentStep === 1 && renderGalleryStep()}
      {currentStep === 2 && renderEditStep()}
      {currentStep === 3 && renderShareStep()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
});