import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';
import { Alert } from 'react-native';

export interface MediaAsset {
  uri: string;
  type: 'image' | 'video';
  width?: number;
  height?: number;
  duration?: number;
  fileSize?: number;
}

export const mediaService = {
  async requestPermissions(): Promise<boolean> {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted' || mediaLibraryStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Camera and media library permissions are required to upload photos and videos.'
      );
      return false;
    }

    return true;
  },

  async pickImage(allowsEditing = true): Promise<MediaAsset | null> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return null;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled) return null;

      const asset = result.assets[0];
      return {
        uri: asset.uri,
        type: 'image',
        width: asset.width,
        height: asset.height,
      };
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
      return null;
    }
  },

  async pickMultipleImages(limit = 10): Promise<MediaAsset[]> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return [];

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: limit,
        quality: 0.8,
      });

      if (result.canceled) return [];

      return result.assets.map(asset => ({
        uri: asset.uri,
        type: 'image' as const,
        width: asset.width,
        height: asset.height,
      }));
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images. Please try again.');
      return [];
    }
  },

  async takePhoto(): Promise<MediaAsset | null> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return null;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled) return null;

      const asset = result.assets[0];
      return {
        uri: asset.uri,
        type: 'image',
        width: asset.width,
        height: asset.height,
      };
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
      return null;
    }
  },

  async pickVideo(): Promise<MediaAsset | null> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return null;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled) return null;

      const asset = result.assets[0];
      return {
        uri: asset.uri,
        type: 'video',
        width: asset.width,
        height: asset.height,
        duration: asset.duration,
      };
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to pick video. Please try again.');
      return null;
    }
  },

  // Pick media (images or videos) for Reels
  async pickMediaForReels(): Promise<MediaAsset | null> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return null;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All, // Allow both images and videos
        allowsEditing: false,
        quality: 0.8,
        videoMaxDuration: 90, // Instagram Reels max duration
      });

      if (result.canceled) return null;

      const asset = result.assets[0];
      const isVideo =
        asset.type === 'video' || asset.uri.includes('.mp4') || asset.uri.includes('.mov');

      return {
        uri: asset.uri,
        type: isVideo ? 'video' : 'image',
        width: asset.width,
        height: asset.height,
        duration: asset.duration,
      };
    } catch (error) {
      console.error('Error picking media for reels:', error);
      Alert.alert('Error', 'Failed to pick media. Please try again.');
      return null;
    }
  },

  async compressImage(
    uri: string,
    quality = 0.7,
    maxWidth = 1080,
    maxHeight = 1080
  ): Promise<string> {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: maxWidth, height: maxHeight } }],
        { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
      );
      return manipResult.uri;
    } catch (error) {
      console.error('Error compressing image:', error);
      return uri;
    }
  },

  async cropImage(
    uri: string,
    cropData: { originX: number; originY: number; width: number; height: number }
  ): Promise<string> {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(uri, [{ crop: cropData }], {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
      });
      return manipResult.uri;
    } catch (error) {
      console.error('Error cropping image:', error);
      return uri;
    }
  },

  async saveToLibrary(uri: string): Promise<boolean> {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Media library permission is required to save images.');
        return false;
      }

      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Success', 'Image saved to your library!');
      return true;
    } catch (error) {
      console.error('Error saving to library:', error);
      Alert.alert('Error', 'Failed to save image. Please try again.');
      return false;
    }
  },

  createFormData(asset: MediaAsset, fieldName = 'file'): FormData {
    const formData = new FormData();
    const filename = asset.uri.split('/').pop() || 'upload';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `${asset.type}/${match[1]}` : asset.type;

    formData.append(fieldName, {
      uri: asset.uri,
      name: filename,
      type,
    } as any);

    return formData;
  },
};
