import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PreviewEditOverlay } from '../../../components/create/reels/PreviewEditOverlay';

export default function ReelsPreviewPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    mediaUri?: string;
    mediaType?: 'photo' | 'video';
  }>();

  const mediaUri = typeof params.mediaUri === 'string' ? params.mediaUri : '';

  const rawType = params.mediaType;
  const mediaType: 'photo' | 'video' =
    rawType === 'video' || rawType === 'photo' ? rawType : 'video';

  if (!mediaUri) {
    router.back();
    return null;
  }

  return (
    <PreviewEditOverlay
      uri={mediaUri}
      mediaType={mediaType}
      onClose={() => router.back()}
      onNext={() => {
        router.push({
          pathname: '/create/reels/post',
          params: { mediaUri, mediaType },
        });
      }}
    />
  );
}
