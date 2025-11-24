import React, { createContext, useContext, useState } from 'react';
import { Platform } from 'react-native'; // Nhớ import Platform
import { extractHashtags } from '@/utils/hashtag';
import { fileService } from '../services/file.service';
import { PostType } from '../types/enum.type';
import { postService } from '../services/post.service';

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

interface UploadParams {
  mediaUris: string[]; // Changed to array
  mediaType: string;
  caption: string;
  hashtags?: string[];
  location?: string;
  userId: string;
  postType?: 'FEED' | 'REEL';
}

interface UploadState {
  status: UploadStatus;
  progress: number;
  thumbnailUri: string | null;
  errorMessage?: string;
  lastParams?: UploadParams;
}

interface UploadContextType {
  uploadState: UploadState;
  startUpload: (data: UploadParams) => Promise<void>;
  retryUpload: () => Promise<void>;
  resetUpload: () => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export const UploadProvider = ({ children }: { children: React.ReactNode }) => {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
    thumbnailUri: null,
  });

  const startUpload = async (params: UploadParams) => {
    const { mediaUris, mediaType, caption, hashtags, location, userId, postType = 'REEL' } = params;

    setUploadState({
      status: 'uploading',
      progress: 0,
      thumbnailUri: mediaUris[0], // Use first media as thumbnail
      lastParams: params,
    });

    try {
      const uploadedFileIds: string[] = [];
      const totalFiles = mediaUris.length;

      // Upload each file and track combined progress
      for (let i = 0; i < mediaUris.length; i++) {
        const mediaUri = mediaUris[i];
        const formData = new FormData();
        const filename = mediaUri.split('/').pop() || `upload_${Date.now()}_${i}`;

        let fileExtension = filename.split('.').pop()?.toLowerCase();
        if (!fileExtension || fileExtension === filename) {
          fileExtension = mediaType === 'video' ? 'mp4' : 'jpg';
        }

        // Always use mp4 for videos to avoid backend Content-Type issues with .mov files
        let mimeType = mediaType === 'video' ? 'video/mp4' : `image/${fileExtension}`;
        if (fileExtension === 'jpeg') mimeType = 'image/jpeg';
        if (fileExtension === 'png') mimeType = 'image/png';

        const cleanUri = Platform.OS === 'ios' ? mediaUri.replace('file://', '') : mediaUri;

        const filePayload = {
          uri: cleanUri,
          name: filename,
          type: mimeType,
        };

        formData.append('file', filePayload as any);

        const usage = postType === 'FEED' ? 'POST' : 'REEL';
        
        // Upload with progress tracking for current file
        const response = await fileService.uploadFile(formData, usage, fileProgress => {
          // Calculate combined progress: (completed files + current file progress) / total files
          const completedProgress = i / totalFiles;
          const currentFileProgress = fileProgress / totalFiles;
          const totalProgress = completedProgress + currentFileProgress;
          
          setUploadState(prev => ({
            ...prev,
            progress: totalProgress * 0.9, // Reserve 10% for post creation
          }));
        });

        uploadedFileIds.push(response.id);
      }

      // Create post with all uploaded files
      const tagsToUse = hashtags && hashtags.length > 0 ? hashtags : extractHashtags(caption);
      const postData = {
        mediaFileIds: uploadedFileIds,
        type: postType === 'FEED' ? PostType.FEED : PostType.REEL,
        caption: caption.trim(),
        tags: tagsToUse,
        location: location,
      };

      await postService.createPost(postData);

      setUploadState(prev => ({
        ...prev,
        status: 'success',
        progress: 1,
        thumbnailUri: mediaUris[0],
      }));
    } catch (error: any) {
      setUploadState(prev => ({
        ...prev,
        status: 'error',
        progress: 0,
        errorMessage: error.response?.data?.message || error.message || 'Upload failed',
      }));
    }
  };

  const retryUpload = async () => {
    if (uploadState.lastParams) {
      await startUpload(uploadState.lastParams);
    }
  };

  const resetUpload = () => {
    setUploadState({ status: 'idle', progress: 0, thumbnailUri: null });
  };

  return (
    <UploadContext.Provider value={{ uploadState, startUpload, retryUpload, resetUpload }}>
      {children}
    </UploadContext.Provider>
  );
};

export const useUpload = () => {
  const context = useContext(UploadContext);
  if (!context) throw new Error('useUpload must be used within UploadProvider');
  return context;
};
