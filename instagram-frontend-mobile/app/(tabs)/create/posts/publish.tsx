import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';

import { SharePage } from '@/components/create/posts/SharePage';

type GalleryAsset = {
  id: string;
  uri: string;
  mediaType: 'photo' | 'video';
  duration?: number;
};

export default function PublishPostScreen() {
  const params = useLocalSearchParams();
  const selected = Array.isArray(params.selected)
    ? JSON.parse(params.selected[0] as string)
    : JSON.parse((params.selected as string) || '[]');
  const gallery: GalleryAsset[] = Array.isArray(params.gallery)
    ? JSON.parse(params.gallery[0] as string)
    : JSON.parse((params.gallery as string) || '[]');

  return (
    <SharePage
      selectedMedia={selected}
      gallery={gallery}
      onBack={() => router.back()}
      onShare={() => Promise.resolve()}
      hideTabbedFlow={true}
      onPostCreated={() => {}}
    />
  );
}


