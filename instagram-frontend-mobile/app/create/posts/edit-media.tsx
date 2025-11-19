import React from 'react';
import { Dimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { EditPage } from '@/components/create/posts/EditPage';

type GalleryAsset = {
  id: string;
  uri: string;
  mediaType: 'photo' | 'video';
  duration?: number;
};

const { height: screenHeight } = Dimensions.get('window');

export default function EditMediaScreen() {
  const params = useLocalSearchParams();
  const selected = Array.isArray(params.selected)
    ? JSON.parse(params.selected[0] as string)
    : JSON.parse((params.selected as string) || '[]');
  const gallery: GalleryAsset[] = Array.isArray(params.gallery)
    ? JSON.parse(params.gallery[0] as string)
    : JSON.parse((params.gallery as string) || '[]');

  const goNext = () => {
    router.push({
      pathname: '/create/posts/publish',
      params: {
        selected: JSON.stringify(selected),
        gallery: JSON.stringify(gallery),
      },
    });
  };

  return (
    <EditPage
      height={screenHeight}
      selectedMedia={selected}
      gallery={gallery}
      onBack={() => router.back()}
      onNext={goNext}
    />
  );
}


