import React, { createContext, useContext, useState } from 'react';
import { uploadAPI, postAPI } from '@/services/api';
import { extractHashtags } from '@/utils/hashtag';

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

interface UploadState {
  status: UploadStatus;
  progress: number;
  thumbnailUri: string | null;
  errorMessage?: string;
}

interface UploadContextType {
  uploadState: UploadState;
  startUpload: (data: {
    mediaUri: string;
    mediaType: string;
    caption: string;
    location?: string;
    userId: string;
  }) => Promise<void>;
  resetUpload: () => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export const UploadProvider = ({ children }: { children: React.ReactNode }) => {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
    thumbnailUri: null,
  });

  const startUpload = async ({ mediaUri, mediaType, caption, location, userId }: any) => {
    setUploadState({ status: 'uploading', progress: 0, thumbnailUri: mediaUri });

    try {
      const progressInterval = setInterval(() => {
        setUploadState(prev => {
          if (prev.status !== 'uploading') return prev;
          return { ...prev, progress: Math.min(prev.progress + 0.1, 0.9) };
        });
      }, 500);

      const formData = new FormData();
      const filename = mediaUri.split('/').pop() || `upload_${Date.now()}`;
      let fileExtension = filename.split('.').pop()?.toLowerCase() || 'jpg';
      let mimeType = mediaType === 'video' ? `video/${fileExtension}` : `image/${fileExtension}`;

      formData.append('file', {
        uri: mediaUri,
        name: filename,
        type: mimeType,
      } as any);

      const mediaUrl = await uploadAPI.uploadFile(formData, 'post', userId);

      const hashtags = extractHashtags(caption);
      const postData = {
        caption: caption.trim(),
        media: [{ url: mediaUrl, type: mediaType === 'video' ? 'REEL' : 'IMAGE' }],
        tags: hashtags,
        location: location,
      };

      await postAPI.createPost(postData);

      clearInterval(progressInterval);

      setUploadState({
        status: 'success',
        progress: 1,
        thumbnailUri: mediaUri,
      });

      setTimeout(() => {
        setUploadState(prev => (prev.status === 'success' ? { ...prev, status: 'idle' } : prev));
      }, 5000);
    } catch (error: any) {
      setUploadState({
        status: 'error',
        progress: 0,
        thumbnailUri: mediaUri,
        errorMessage: error.message,
      });
    }
  };

  const resetUpload = () => {
    setUploadState({ status: 'idle', progress: 0, thumbnailUri: null });
  };

  return (
    <UploadContext.Provider value={{ uploadState, startUpload, resetUpload }}>
      {children}
    </UploadContext.Provider>
  );
};

export const useUpload = () => {
  const context = useContext(UploadContext);
  if (!context) throw new Error('useUpload must be used within UploadProvider');
  return context;
};
