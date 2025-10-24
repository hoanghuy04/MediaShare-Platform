import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@hooks/useTheme';
import { mediaService, MediaAsset } from '@services/media';

interface ImagePickerProps {
  onMediaSelected: (media: MediaAsset[]) => void;
  onCancel: () => void;
}

export const ImagePicker: React.FC<ImagePickerProps> = ({ onMediaSelected, onCancel }) => {
  const { theme } = useTheme();

  const handlePickImage = async () => {
    const image = await mediaService.pickImage();
    if (image) {
      onMediaSelected([image]);
    }
  };

  const handlePickMultiple = async () => {
    const images = await mediaService.pickMultipleImages();
    if (images.length > 0) {
      onMediaSelected(images);
    }
  };

  const handleTakePhoto = async () => {
    const photo = await mediaService.takePhoto();
    if (photo) {
      onMediaSelected([photo]);
    }
  };

  const handlePickVideo = async () => {
    const video = await mediaService.pickVideo();
    if (video) {
      onMediaSelected([video]);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Create Post</Text>
        <TouchableOpacity onPress={onCancel}>
          <Ionicons name="close" size={28} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.options}>
        <TouchableOpacity
          style={[styles.option, { backgroundColor: theme.colors.surface }]}
          onPress={handleTakePhoto}
        >
          <Ionicons name="camera" size={48} color={theme.colors.primary} />
          <Text style={[styles.optionText, { color: theme.colors.text }]}>Take Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, { backgroundColor: theme.colors.surface }]}
          onPress={handlePickImage}
        >
          <Ionicons name="image" size={48} color={theme.colors.primary} />
          <Text style={[styles.optionText, { color: theme.colors.text }]}>Choose Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, { backgroundColor: theme.colors.surface }]}
          onPress={handlePickMultiple}
        >
          <Ionicons name="images" size={48} color={theme.colors.primary} />
          <Text style={[styles.optionText, { color: theme.colors.text }]}>Multiple Photos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, { backgroundColor: theme.colors.surface }]}
          onPress={handlePickVideo}
        >
          <Ionicons name="videocam" size={48} color={theme.colors.primary} />
          <Text style={[styles.optionText, { color: theme.colors.text }]}>Choose Video</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  options: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
  },
  option: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  optionText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});

