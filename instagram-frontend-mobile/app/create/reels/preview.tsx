import { PreviewEditOverlay } from '@/components/create/reels/PreviewEditOverlay';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function ReelsPreviewPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    mediaUri: string;
    mediaType: 'photo' | 'video';
  }>();

  const handleClose = () => {
    router.back();
  };

  const handleNext = () => {
    router.push({
      pathname: '/create/reels/post',
      params: {
        mediaUri: params.mediaUri,
        mediaType: params.mediaType,
      },
    });
  };

  return (
    <PreviewEditOverlay
      uri={params.mediaUri || ''}
      mediaType={params.mediaType || 'photo'}
      onClose={handleClose}
      onNext={handleNext}
    />
  );
}
