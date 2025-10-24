import { ReelPostScreen } from '@/components/create/reels/ReelPostScreen';
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

  const handleShare = (caption: string, location?: string, tags?: string[]) => {
    console.log('Share reel:', { caption, location, tags, uri: params.mediaUri });
    // TODO: Implement actual share logic (upload to server)

    // Navigate to profile after sharing
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
