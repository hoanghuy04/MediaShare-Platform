import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ReelPostData, ReelPostScreen } from '../../../components/create/reels/ReelPostScreen';

export default function ReelsPostPage() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    mediaUri?: string;
    mediaType?: 'photo' | 'video';
  }>();

  const mediaUri = typeof params.mediaUri === 'string' ? params.mediaUri : '';

  const rawMediaType = params.mediaType;
  const mediaType: 'photo' | 'video' =
    rawMediaType === 'video' || rawMediaType === 'photo' ? rawMediaType : 'photo';

  const handleBack = () => {
    router.back();
  };

  const handleShare = (data: ReelPostData) => {
    router.replace('/(tabs)/feed');
  };

  return (
    <ReelPostScreen
      mediaUri={mediaUri}
      mediaType={mediaType}
      onBack={handleBack}
      onShare={handleShare}
    />
  );
}
