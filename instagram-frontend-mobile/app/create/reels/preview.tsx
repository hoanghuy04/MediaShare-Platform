import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PreviewEditOverlay } from '../../../components/create/reels/PreviewEditOverlay';

export default function ReelsPreviewPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    videoUri?: string;
    mediaType?: 'photo' | 'video';
  }>();

  const videoUri = typeof params.videoUri === 'string' ? params.videoUri : '';
  const rawType = params.mediaType;
  const mediaType: 'photo' | 'video' =
    rawType === 'video' || rawType === 'photo' ? rawType : 'video';

  if (!videoUri) {
    router.back();
    return null;
  }

  return (
    <PreviewEditOverlay
      uri={videoUri}
      mediaType={mediaType}
      onClose={() => router.back()}
      onNext={() => {
        router.push({
          pathname: '/create/reels/post',
          params: { mediaUri: videoUri, mediaType },
        });
      }}
    />
  );
}
