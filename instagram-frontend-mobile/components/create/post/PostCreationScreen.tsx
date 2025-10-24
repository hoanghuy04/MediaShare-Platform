import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface MediaItem {
  id: string;
  uri: string;
  type: 'image' | 'video';
}

export const PostCreationScreen: React.FC = () => {
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [galleryExpanded, setGalleryExpanded] = useState(false);

  // Mock data for recent media
  const recentMedia: MediaItem[] = Array.from({ length: 20 }, (_, i) => ({
    id: `media-${i}`,
    uri: `https://picsum.photos/200/200?random=${i}`,
    type: i % 5 === 0 ? 'video' : 'image',
  }));

  const handleMediaSelect = (id: string) => {
    if (selectedMedia.includes(id)) {
      setSelectedMedia(selectedMedia.filter(item => item !== id));
    } else {
      setSelectedMedia([...selectedMedia, id]);
    }
  };

  return (
    <View style={styles.container}>
      {/* Action Bar */}
      <View style={styles.actionBar}>
        <View style={styles.spacer} />
        <TouchableOpacity style={styles.nextButtonContainer}>
          <Text style={styles.nextButton}>Tiếp</Text>
        </TouchableOpacity>
      </View>

      {/* Preview Area */}
      <View style={styles.previewContainer}>
        {selectedMedia.length > 0 ? (
          <Image
            source={{ uri: recentMedia.find(m => m.id === selectedMedia[0])?.uri }}
            style={styles.previewImage}
          />
        ) : (
          <View style={styles.previewPlaceholder}>
            <Ionicons name="camera-outline" size={80} color="#666" />
          </View>
        )}
      </View>

      {/* Gallery Section */}
      <View style={styles.gallerySection}>
        <View style={styles.galleryHeader}>
          <TouchableOpacity
            style={styles.galleryDropdown}
            onPress={() => setGalleryExpanded(!galleryExpanded)}
          >
            <Text style={styles.galleryTitle}>Mới đây</Text>
            <Ionicons
              name={galleryExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="white"
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.multiSelectButton}>
            <Ionicons name="copy-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Photo Grid */}
        <FlatList
          data={recentMedia}
          numColumns={3}
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => (
            <TouchableOpacity style={styles.gridItem} onPress={() => handleMediaSelect(item.id)}>
              <Image source={{ uri: item.uri }} style={styles.gridImage} />
              {item.type === 'video' && (
                <View style={styles.videoIndicator}>
                  <Ionicons name="play" size={20} color="white" />
                </View>
              )}
              {selectedMedia.includes(item.id) && (
                <View style={styles.selectedOverlay}>
                  <View style={styles.selectedNumber}>
                    <Text style={styles.selectedNumberText}>
                      {selectedMedia.indexOf(item.id) + 1}
                    </Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.gridContainer}
        />
      </View>

      {/* Camera Button */}
      <TouchableOpacity style={styles.cameraButton}>
        <Ionicons name="camera" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000',
  },
  spacer: {
    width: 60,
  },
  nextButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  nextButton: {
    color: '#3897f0',
    fontSize: 16,
    fontWeight: '600',
  },
  previewContainer: {
    width: '100%',
    height: width,
    backgroundColor: '#1a1a1a',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
  },
  gallerySection: {
    flex: 1,
    backgroundColor: '#000',
  },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  galleryDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  galleryTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  multiSelectButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContainer: {
    paddingBottom: 100,
  },
  gridItem: {
    width: width / 3,
    height: width / 3,
    padding: 1,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  videoIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3897f0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 8,
    right: 8,
  },
  selectedNumberText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
});
