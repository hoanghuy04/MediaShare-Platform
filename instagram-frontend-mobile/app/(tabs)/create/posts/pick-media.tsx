import React, { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';
import { router } from 'expo-router';

import { GalleryPage } from '@/components/create/posts/GalleryPage';

type GalleryAsset = {
  id: string;
  uri: string;
  mediaType: 'photo' | 'video';
  duration?: number;
};

const { height: screenHeight } = Dimensions.get('window');

export default function PickMediaScreen() {
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [gallery, setGallery] = useState<GalleryAsset[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(true);

  // Mock gallery (kept from previous implementation)
  useEffect(() => {
    const mock: GalleryAsset[] = [
      { id: '1', uri: 'https://picsum.photos/400/400?random=1', mediaType: 'photo' },
      { id: '2', uri: 'https://picsum.photos/400/400?random=2', mediaType: 'photo' },
      { id: '3', uri: 'https://picsum.photos/400/400?random=3', mediaType: 'video', duration: 15 },
      { id: '4', uri: 'https://picsum.photos/400/400?random=4', mediaType: 'photo' },
      { id: '5', uri: 'https://picsum.photos/400/400?random=5', mediaType: 'photo' },
      { id: '6', uri: 'https://picsum.photos/400/400?random=6', mediaType: 'video', duration: 30 },
      { id: '7', uri: 'https://picsum.photos/400/400?random=7', mediaType: 'photo' },
      { id: '8', uri: 'https://picsum.photos/400/400?random=8', mediaType: 'photo' },
      { id: '9', uri: 'https://picsum.photos/400/400?random=9', mediaType: 'video', duration: 45 },
      { id: '10', uri: 'https://picsum.photos/400/400?random=10', mediaType: 'photo' },
      { id: '11', uri: 'https://picsum.photos/400/400?random=11', mediaType: 'photo' },
      { id: '12', uri: 'https://picsum.photos/400/400?random=12', mediaType: 'video', duration: 20 },
    ];
    setGallery(mock);
    setLoadingGallery(false);
  }, []);

  const onSelectMedia = (id: string) => {
    setSelectedMedia(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const goNext = () => {
    if (selectedMedia.length === 0) return;
    router.push({
      pathname: '/(tabs)/create/posts/edit-media',
      params: {
        selected: JSON.stringify(selectedMedia),
        gallery: JSON.stringify(gallery),
      },
    });
  };

  return (
    <GalleryPage
      height={screenHeight}
      gallery={gallery}
      loadingGallery={loadingGallery}
      selectedMedia={selectedMedia}
      onGoToCamera={() => router.push('/(tabs)/feed')}
      onScrollBeginDrag={() => {}}
      onScroll={() => {}}
      onScrollEndDrag={() => {}}
      onSelectMedia={onSelectMedia}
      onNext={goNext}
    />
  );
}


