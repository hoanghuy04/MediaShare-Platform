import axiosInstance from '../config/axiosInstance';
import { API_ENDPOINTS } from '../config/routes';
import { MediaFileResponse } from '../types/media.type';

export const fileService = {
  uploadFile: async (
    file: FormData,
    usage: 'PROFILE' | 'POST' | 'REEL' | 'STORY' = 'POST',
    onProgress?: (progress: number) => void
  ): Promise<MediaFileResponse> => {
    const response = await axiosInstance.post(
      `${API_ENDPOINTS.UPLOAD_POST_MEDIA}?usage=${usage}`,
      file,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: progressEvent => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted / 100);
          }
        },
      }
    );

    return response.data.data;
  },

  uploadMultipleFiles: async (
    files: FormData,
    usage: 'PROFILE' | 'POST' | 'REEL' | 'STORY' = 'POST'
  ): Promise<string[]> => {
    const response = await axiosInstance.post(
      `${API_ENDPOINTS.UPLOAD_POST_MEDIA_BATCH}?usage=${usage}`,
      files,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },

  deleteFile: async (fileId: string): Promise<void> => {
    await axiosInstance.delete(API_ENDPOINTS.DELETE_FILE(fileId));
  },
};
