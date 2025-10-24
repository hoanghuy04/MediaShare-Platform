import { ReelPostScreen, type ReelPostData } from '@/components/create/reels/ReelPostScreen';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function ReelsPostPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    mediaUri: string;
    mediaType: 'photo' | 'video';
  }>();

  const handleBack = () => {
    router.back();
  };

  const handleShare = (data: ReelPostData) => {
    router.replace('/(tabs)/profile');
  };

  return (
    <ReelPostScreen
      mediaUri={params.mediaUri || ''}
      mediaType={params.mediaType || 'photo'}
      onBack={handleBack}
      onShare={handleShare}
    />
  );
}
