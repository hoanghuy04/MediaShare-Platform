import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PREVIEW_WIDTH = SCREEN_WIDTH * 0.4;
const PREVIEW_HEIGHT = PREVIEW_WIDTH * 1.78; // 16:9 aspect ratio

type ReelPostScreenProps = {
  mediaUri: string;
  mediaType: 'photo' | 'video';
  onBack: () => void;
  onShare: (caption: string, location?: string, tags?: string[]) => void;
};

export function ReelPostScreen({ mediaUri, mediaType, onBack, onShare }: ReelPostScreenProps) {
  const [caption, setCaption] = useState('');
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('');

  const handleShare = () => {
    onShare(caption, selectedLocation);
  };

  const handleSaveDraft = () => {
    console.log('Save draft:', { caption, selectedLocation });
    // TODO: Implement save draft logic
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New reel</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Preview and Edit Section */}
        <View style={styles.previewSection}>
          {/* Media Preview */}
          <View style={styles.previewContainer}>
            {mediaType === 'video' ? (
              <Video
                source={{ uri: mediaUri }}
                style={styles.previewMedia}
                resizeMode={ResizeMode.COVER}
                shouldPlay
                isLooping
                isMuted
              />
            ) : (
              <Image source={{ uri: mediaUri }} style={styles.previewMedia} resizeMode="cover" />
            )}

            {/* Edit Tools */}
            <View style={styles.editTools}>
              <TouchableOpacity style={styles.toolBtn}>
                <Ionicons name="musical-notes" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolBtn}>
                <Text style={styles.toolBtnText}>Aa</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolBtn}>
                <Ionicons name="happy-outline" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolBtn}>
                <Ionicons name="sparkles-outline" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolBtn}>
                <Ionicons name="images-outline" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolBtn}>
                <Ionicons name="mic-outline" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolBtn}>
                <Ionicons name="cut-outline" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolBtn}>
                <Ionicons name="ellipsis-horizontal" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.editCoverBtn}>
              <Text style={styles.editCoverText}>Edit cover</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Caption Input */}
        <View style={styles.captionSection}>
          <TextInput
            style={styles.captionInput}
            placeholder="Write a caption and add hashtags..."
            placeholderTextColor="#999"
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={2200}
          />
        </View>

        {/* Action Chips */}
        <View style={styles.chipsRow}>
          <TouchableOpacity style={styles.chip}>
            <Text style={styles.chipIcon}>#</Text>
            <Text style={styles.chipText}>Hashtags</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.chip}>
            <Ionicons name="bar-chart" size={18} color="#666" style={{ marginRight: 6 }} />
            <Text style={styles.chipText}>Poll</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.chip}>
            <Ionicons name="search" size={18} color="#666" style={{ marginRight: 6 }} />
            <Text style={styles.chipText}>Prompt</Text>
          </TouchableOpacity>
        </View>

        {/* Tag People */}
        <TouchableOpacity style={styles.optionRow}>
          <View style={styles.optionLeft}>
            <Ionicons name="person-circle-outline" size={28} color="#000" />
            <Text style={styles.optionText}>Tag people</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#999" />
        </TouchableOpacity>

        {/* Add Location */}
        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => setShowLocationSuggestions(!showLocationSuggestions)}
        >
          <View style={styles.optionLeft}>
            <Ionicons name="location-outline" size={28} color="#000" />
            <Text style={styles.optionText}>Add location</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#999" />
        </TouchableOpacity>

        {/* Location Suggestions */}
        {showLocationSuggestions && (
          <View style={styles.locationSuggestions}>
            <TouchableOpacity
              style={styles.locationItem}
              onPress={() => {
                setSelectedLocation('IUH - Trường Đại học Công...');
                setShowLocationSuggestions(false);
              }}
            >
              <Text style={styles.locationText}>IUH - Trường Đại học Công...</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.locationItem}
              onPress={() => {
                setSelectedLocation('Thành phố Hồ Chí Minh');
                setShowLocationSuggestions(false);
              }}
            >
              <Text style={styles.locationText}>Thành phố Hồ Chí Minh</Text>
            </TouchableOpacity>
          </View>
        )}

        {selectedLocation && (
          <View style={styles.selectedLocationContainer}>
            <Text style={styles.selectedLocationLabel}>Selected location:</Text>
            <Text style={styles.selectedLocationText}>{selectedLocation}</Text>
            <Text style={styles.locationNote}>
              People you share this content with can see the location you tag and view this content
              on the map.
            </Text>
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.saveDraftBtn} onPress={handleSaveDraft}>
          <Text style={styles.saveDraftText}>Save draft</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Text style={styles.shareBtnText}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Learn More Link */}
      <TouchableOpacity style={styles.learnMoreBtn}>
        <Text style={styles.learnMoreText}>Learn more about Reels.</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },

  content: {
    flex: 1,
  },

  previewSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  previewContainer: {
    width: PREVIEW_WIDTH,
    height: PREVIEW_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  previewMedia: {
    width: '100%',
    height: '100%',
  },

  editTools: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  toolBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  editCoverBtn: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editCoverText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  captionSection: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  captionInput: {
    fontSize: 15,
    color: '#000',
    minHeight: 80,
    textAlignVertical: 'top',
  },

  chipsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  chipIcon: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
    marginRight: 6,
  },
  chipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },

  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '400',
  },

  locationSuggestions: {
    backgroundColor: '#f9f9f9',
    marginHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  locationItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  locationText: {
    fontSize: 15,
    color: '#000',
  },

  selectedLocationContainer: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  selectedLocationLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  selectedLocationText: {
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
    marginBottom: 8,
  },
  locationNote: {
    fontSize: 13,
    color: '#999',
    lineHeight: 18,
  },

  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  saveDraftBtn: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveDraftText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  shareBtn: {
    flex: 1,
    backgroundColor: '#0095f6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  shareBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  learnMoreBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  learnMoreText: {
    fontSize: 14,
    color: '#0095f6',
    fontWeight: '500',
  },
});
