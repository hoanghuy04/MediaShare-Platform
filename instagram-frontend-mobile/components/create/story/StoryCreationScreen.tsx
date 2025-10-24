import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface StoryOption {
  id: string;
  icon: any;
  label: string;
}

export const StoryCreationScreen: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  const storyOptions: StoryOption[] = [
    { id: 'text', icon: 'text', label: 'Tạo' },
    { id: 'boomerang', icon: 'infinity', label: 'Boomerang' },
    { id: 'layout', icon: 'grid', label: 'Bố cục' },
  ];

  return (
    <View style={styles.container}>
      {/* Top Controls - Flash */}
      <View style={styles.topControls}>
        <TouchableOpacity style={styles.flashButton}>
          <Ionicons name="flash-off" size={28} color="white" />
        </TouchableOpacity>
      </View>

      {/* Camera/Preview Area */}
      <View style={styles.cameraArea}>
        {selectedImage ? (
          <Image source={{ uri: selectedImage }} style={styles.previewImage} />
        ) : (
          <View style={styles.cameraPlaceholder} />
        )}
      </View>

      {/* Left Side Options */}
      <View style={styles.leftOptions}>
        {storyOptions.map((option, index) => (
          <View key={option.id}>
            <TouchableOpacity style={styles.optionButton}>
              <Ionicons name={option.icon as any} size={28} color="white" />
            </TouchableOpacity>
            <Text style={styles.optionLabel}>{option.label}</Text>
            {index < storyOptions.length - 1 && <View style={styles.optionSpacer} />}
          </View>
        ))}

        {/* Expand Button */}
        <TouchableOpacity
          style={[styles.optionButton, styles.expandButton]}
          onPress={() => setShowMoreOptions(!showMoreOptions)}
        >
          <Ionicons
            name={showMoreOptions ? 'chevron-up' : 'chevron-down'}
            size={28}
            color="white"
          />
        </TouchableOpacity>
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        {/* Gallery Preview Button */}
        <TouchableOpacity style={styles.galleryButton}>
          <Ionicons name="images-outline" size={24} color="white" />
        </TouchableOpacity>

        {/* Recent Photos */}
        <View style={styles.recentPhotos}>
          <Text style={styles.recentTitle}>Mới đây</Text>
          <TouchableOpacity style={styles.selectButton}>
            <Ionicons name="copy-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Photo Grid */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
          {[1, 2, 3, 4].map(item => (
            <TouchableOpacity key={item} style={styles.photoItem}>
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera" size={40} color="#666" />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Capture Button */}
      <View style={styles.captureSection}>
        <View style={styles.captureContainer}>
          <TouchableOpacity style={styles.effectButton}>
            <MaterialCommunityIcons name="shimmer" size={30} color="white" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.captureButton}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.avatarButton}>
            <Ionicons name="person-circle" size={40} color="#888" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatarButton}>
            <Ionicons name="person-circle" size={40} color="#888" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  topControls: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    flexDirection: 'row',
  },
  flashButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 22,
  },
  cameraArea: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  cameraPlaceholder: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  leftOptions: {
    position: 'absolute',
    left: 20,
    top: '30%',
    zIndex: 10,
  },
  optionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionLabel: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
  },
  optionSpacer: {
    height: 20,
  },
  expandButton: {
    marginTop: 10,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 140,
    left: 0,
    right: 0,
    paddingHorizontal: 15,
  },
  galleryButton: {
    position: 'absolute',
    left: 20,
    top: -40,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentPhotos: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  recentTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  selectButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoScroll: {
    flexDirection: 'row',
  },
  photoItem: {
    marginRight: 8,
  },
  photoPlaceholder: {
    width: 120,
    height: 160,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureSection: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  effectButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  avatarButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
