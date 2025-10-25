/**
 * Video utility functions for handling video format compatibility
 */

export const isVideoFormatSupported = (url: string): boolean => {
  // Check if URL is a mock URL (picsum.photos)
  if (url.includes('picsum.photos')) {
    return false; // Mock URLs are not real videos
  }
  
  // Check for supported video formats
  const supportedFormats = ['.mp4', '.mov', '.m4v', '.avi', '.mkv', '.webm'];
  const urlLower = url.toLowerCase();
  return supportedFormats.some(format => urlLower.includes(format));
};

export const getVideoThumbnail = (url: string): string => {
  // For mock URLs, return the same URL as thumbnail
  if (url.includes('picsum.photos')) {
    return url;
  }
  
  // For real videos, you might want to generate a thumbnail
  // For now, return the same URL
  return url;
};

export const isVideoUrl = (url: string): boolean => {
  const videoExtensions = ['.mp4', '.mov', '.m4v', '.avi', '.mkv', '.webm', '.flv', '.wmv'];
  const urlLower = url.toLowerCase();
  return videoExtensions.some(ext => urlLower.includes(ext));
};

export const getVideoFormat = (url: string): string | null => {
  const videoExtensions = ['.mp4', '.mov', '.m4v', '.avi', '.mkv', '.webm', '.flv', '.wmv'];
  const urlLower = url.toLowerCase();
  
  for (const ext of videoExtensions) {
    if (urlLower.includes(ext)) {
      return ext;
    }
  }
  
  return null;
};
