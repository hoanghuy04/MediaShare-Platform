import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MediaAsset } from '@services/media';
import { ImagePicker } from './ImagePicker';
import { PostEditor } from './PostEditor';

type CreateStep = 'select' | 'edit' | 'caption';

interface CreatePostFlowProps {
  onComplete?: () => void;
}

export const CreatePostFlow: React.FC<CreatePostFlowProps> = ({ onComplete }) => {
  const router = useRouter();
  const [step, setStep] = useState<CreateStep>('select');
  const [selectedMedia, setSelectedMedia] = useState<MediaAsset[]>([]);

  const handleMediaSelected = (media: MediaAsset[]) => {
    setSelectedMedia(media);
    setStep('caption');
  };

  const handleBack = () => {
    if (step === 'caption') {
      setStep('select');
      setSelectedMedia([]);
    } else {
      router.back();
    }
  };

  const handlePublish = async (caption: string) => {
    // TODO: Implement post creation
    onComplete?.();
    router.back();
  };

  return (
    <View style={styles.container}>
      {step === 'select' && (
        <ImagePicker onMediaSelected={handleMediaSelected} onCancel={() => router.back()} />
      )}
      
      {step === 'caption' && (
        <PostEditor
          media={selectedMedia}
          onBack={handleBack}
          onPublish={handlePublish}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

