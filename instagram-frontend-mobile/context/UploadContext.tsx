import React, { createContext, useContext, useState } from 'react';
import { Platform } from 'react-native'; // Nhớ import Platform
import { extractHashtags } from '@/utils/hashtag';
import { fileService } from '../services/file.service';
import { PostType } from '../types/enum.type';
import { postService } from '../services/post.service';

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

interface UploadParams {
  mediaUri: string;
  mediaType: string;
  caption: string;
  location?: string;
  userId: string;
  postType?: 'FEED' | 'REEL'; // Add post type option
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
    const { mediaUri, mediaType, caption, location, userId, postType = 'REEL' } = params;

    setUploadState({
      status: 'uploading',
      progress: 0,
      thumbnailUri: mediaUri,
      lastParams: params,
    });

    try {
      const formData = new FormData();
      const filename = mediaUri.split('/').pop() || `upload_${Date.now()}`;

      let fileExtension = filename.split('.').pop()?.toLowerCase();
      if (!fileExtension || fileExtension === filename) {
        fileExtension = mediaType === 'video' ? 'mp4' : 'jpg';
      }

      let mimeType = mediaType === 'video' ? `video/${fileExtension}` : `image/${fileExtension}`;
      if (mimeType === 'video/mov') mimeType = 'video/quicktime';

      const cleanUri = Platform.OS === 'ios' ? mediaUri.replace('file://', '') : mediaUri;

      const filePayload = {
        uri: cleanUri,
        name: filename,
        type: mimeType,
      };

      formData.append('file', filePayload as any);

      const usage = postType === 'FEED' ? 'POST' : 'REEL';
      const response = await fileService.uploadFile(formData, usage, progress => {
        setUploadState(prev => ({
          ...prev,
          progress: progress * 0.9,
        }));
      });

      const hashtags = extractHashtags(caption);
      const postData = {
        mediaFileIds: [response.id],
        type: postType === 'FEED' ? PostType.FEED : PostType.REEL,
        caption: caption.trim(),
        tags: hashtags,
        location: location,
      };

      await postService.createPost(postData);

      setUploadState(prev => ({
        ...prev,
        status: 'success',
        progress: 1,
        thumbnailUri: mediaUri,
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
