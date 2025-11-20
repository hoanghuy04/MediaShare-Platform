import { MediaCategory, MediaUsage } from './enum.type';

export interface MediaFileResponse {
  id: string;
  url: string;
  fileName: string;
  fileSize: number;
  category: MediaCategory;
  usage: MediaUsage;
  contentType: string;
  uploadedAt: string;
}
