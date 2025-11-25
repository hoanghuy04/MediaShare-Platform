import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Image,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@hooks/useTheme';
import { useAuth } from '@hooks/useAuth';
import { userService } from '@/services/user.service';
import { fileService } from '@/services/file.service';
import { showAlert } from '@utils/helpers';
import { UpdateUserRequest } from '@/types/user';
import { getInitials } from '../../utils/helpers';

export default function EditProfileScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user, updateUser } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.profile?.avatar || null);
  const [formData, setFormData] = useState<UpdateUserRequest>({
    firstName: user?.profile?.firstName || '',
    lastName: user?.profile?.lastName || '',
    bio: user?.profile?.bio || '',
    website: user?.profile?.website || '',
    location: user?.profile?.location || '',
    isPrivate: user?.isPrivate || false,
  });

  useEffect(() => {
    if (user?.profile?.avatar && user.profile.avatar.trim() !== '') {
      setAvatarUri(user.profile.avatar);
    } else {
      setAvatarUri(null);
    }
  }, [user?.profile?.avatar]);

  const handleSave = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      await userService.updateUser(user.id, formData);
      const refreshedUser = await userService.getUserById(user.id);
      if (refreshedUser) {
        updateUser(refreshedUser);
      }
      showAlert('Thành công', 'Đã cập nhật thông tin cá nhân');
      router.back();
    } catch (error: any) {
      showAlert('Lỗi', error.message || 'Không thể cập nhật thông tin');
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: keyof UpdateUserRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // const getAvatarBackgroundColor = (name: string) => {
    // const colors = [
    //   '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    //   '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
    //   '#E63946', '#A8DADC', '#457B9D', '#E76F51', '#2A9D8F'
    // ];
  //   const index = (name.charCodeAt(0) + name.length) % colors.length;
  //   return colors[index];
  // };

  // const getInitials = () => {
  //   const firstName = formData.firstName || user?.profile?.firstName || user?.username || 'U';
  //   return firstName.charAt(0).toUpperCase();
  // };

  const handlePickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Quyền truy cập', 'Cần quyền truy cập thư viện ảnh để chọn avatar');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setUploadingAvatar(true);
        
        try {
          const formData = new FormData();
          const filename = asset.uri.split('/').pop() || `avatar_${Date.now()}.jpg`;
          const fileExtension = filename.split('.').pop()?.toLowerCase() || 'jpg';
          const mimeType = `image/${fileExtension}`;

          const cleanUri = Platform.OS === 'ios' ? asset.uri.replace('file://', '') : asset.uri;

          const filePayload = {
            uri: cleanUri,
            name: filename,
            type: mimeType,
          };

          formData.append('file', filePayload as any);

          const uploadedFile = await fileService.uploadFile(formData, 'PROFILE');
          
          if (user?.id) {
            await userService.updateUser(user.id, { avatar: uploadedFile.id });
            setAvatarUri(uploadedFile.url);
            
            const refreshedUser = await userService.getUserById(user.id);
            if (refreshedUser) {
              updateUser(refreshedUser);
            }
            
            showAlert('Thành công', 'Đã cập nhật ảnh đại diện');
          }
        } catch (error: any) {
          showAlert('Lỗi', error.message || 'Không thể tải ảnh lên');
        } finally {
          setUploadingAvatar(false);
        }
      }
    } catch (error: any) {
      showAlert('Lỗi', error.message || 'Không thể chọn ảnh');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="close" size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Chỉnh sửa trang cá nhân
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          style={styles.headerButton}
          disabled={isLoading}
        >
          <Ionicons
            name="checkmark"
            size={28}
            color={isLoading ? theme.colors.textSecondary : theme.colors.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {avatarUri && avatarUri.trim() !== '' ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={[
                styles.avatar, 
                { backgroundColor: "#acb8beff" }
              ]}>
                <Text style={styles.avatarInitial}>{getInitials(formData.firstName || user?.username || 'User')}</Text>
              </View>
            )}
            {uploadingAvatar && (
              <View style={styles.uploadingOverlay}>
                <Text style={styles.uploadingText}>Đang tải...</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={handlePickAvatar} disabled={uploadingAvatar}>
            <Text style={[styles.changePhotoText, { color: theme.colors.primary }]}>
              {uploadingAvatar ? 'Đang tải lên...' : 'Chỉnh sửa ảnh hoặc avatar'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          {/* Username - Read only, first */}
          <View style={[styles.inputGroup, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Username</Text>
            <TextInput
              style={[styles.input, { color: theme.colors.textSecondary }]}
              value={user?.username}
              editable={false}
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          {/* First Name */}
          <View style={[styles.inputGroup, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.label, { color: theme.colors.text }]}>First Name</Text>
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              value={formData.firstName}
              onChangeText={text => updateField('firstName', text)}
              placeholder="First Name"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          {/* Last Name */}
          <View style={[styles.inputGroup, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Last Name</Text>
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              value={formData.lastName}
              onChangeText={text => updateField('lastName', text)}
              placeholder="Last Name"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          {/* Bio */}
          <View style={[styles.inputGroup, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea, { color: theme.colors.text }]}
              value={formData.bio}
              onChangeText={text => updateField('bio', text)}
              placeholder="Tell your story..."
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              numberOfLines={3}
              maxLength={500}
            />
          </View>

          {/* Website */}
          <View style={[styles.inputGroup, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Website</Text>
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              value={formData.website}
              onChangeText={text => updateField('website', text)}
              placeholder="Add link"
              placeholderTextColor={theme.colors.textSecondary}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          {/* Location */}
          <View style={[styles.inputGroup, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Location</Text>
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              value={formData.location}
              onChangeText={text => updateField('location', text)}
              placeholder="Add location"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>
        </View>

        {/* Privacy Toggle */}
        <View style={styles.privacySection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Quyền riêng tư
          </Text>
          <View
            style={[
              styles.privacyItem,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <View style={styles.privacyText}>
              <Text style={[styles.privacyTitle, { color: theme.colors.text }]}>
                Tài khoản riêng tư
              </Text>
              <Text style={[styles.privacyDescription, { color: theme.colors.textSecondary }]}>
                Chỉ người theo dõi bạn mới có thể xem nội dung
              </Text>
            </View>
            <Switch
              value={formData.isPrivate}
              onValueChange={value => updateField('isPrivate', value)}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            />
          </View>
        </View>

        {/* Footer Options */}
        <View style={styles.footerSection}>
          <TouchableOpacity style={styles.footerLink}>
            <Text style={[styles.footerLinkText, { color: theme.colors.primary }]}>
              Chuyển sang tài khoản công việc
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerLink}>
            <Text style={[styles.footerLinkText, { color: theme.colors.primary }]}>
              Cài đặt thông tin cá nhân
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 45,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '600',
  },
  formSection: {
    marginBottom: 24,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  label: {
    width: 100,
    fontSize: 14,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  privacySection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  privacyText: {
    flex: 1,
    marginRight: 12,
  },
  privacyTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  privacyDescription: {
    fontSize: 12,
  },
  footerSection: {
    paddingHorizontal: 16,
    marginBottom: 40,
  },
  footerLink: {
    paddingVertical: 12,
  },
  footerLinkText: {
    fontSize: 14,
  },
});
