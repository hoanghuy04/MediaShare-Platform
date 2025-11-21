import React, { useEffect, useState, useCallback } from 'react';
import { Dimensions } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as MediaLibrary from 'expo-media-library';
import { GalleryPage } from './GalleryPage';
import { mediaService } from '../../../services/media';
import { GalleryAsset } from '../../../types';

const { height: screenHeight } = Dimensions.get('window');

interface PostCreationScreenProps {
  onClose: () => void;
  onStepChange?: (step: number) => void;
  onPostCreated?: () => void; 
}

export default function PostCreationScreen({ onClose, onStepChange, onPostCreated }: PostCreationScreenProps) {
  const router = useRouter();
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [gallery, setGallery] = useState<GalleryAsset[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(true);
  const [hasMediaPermission, setHasMediaPermission] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const mediaStatus = await MediaLibrary.requestPermissionsAsync();
      setHasMediaPermission(mediaStatus.status === 'granted');
    })();
  }, []);

  const loadGallery = useCallback(async () => {
    if (!hasMediaPermission) return;

    setLoadingGallery(true);
    try {
      const assets = await MediaLibrary.getAssetsAsync({
        mediaType: ['photo', 'video'],
        sortBy: [['creationTime', false]],
        first: 80,
      });
      const mapped: GalleryAsset[] = await Promise.all(
        assets.assets.map(async (a) => {
          try {
            const assetInfo = await MediaLibrary.getAssetInfoAsync(a.id, {
              shouldDownloadFromNetwork: false,
            });
            const finalUri = assetInfo.localUri || a.uri;
        
            if (finalUri.startsWith('ph://')) {
              try {
                const retryInfo = await MediaLibrary.getAssetInfoAsync(a.id, {
                  shouldDownloadFromNetwork: true,
                });
                if (retryInfo.localUri) {
                  return {
                    id: a.id,
                    uri: retryInfo.localUri,
                    mediaType: a.mediaType === 'video' ? 'video' : 'photo',
                    duration: a.duration,
                  };
                }
              } catch (retryErr) {
                // Ignore retry error
              }
            }
            
            return {
              id: a.id,
              uri: finalUri, 
              mediaType: a.mediaType === 'video' ? 'video' : 'photo',
              duration: a.duration,
            };
          } catch (err) {
            
            return {
              id: a.id,
              uri: a.uri,
              mediaType: a.mediaType === 'video' ? 'video' : 'photo',
              duration: a.duration,
            };
          }
        })
      );

      setGallery(mapped);
    } catch (err) {
      console.error('Error loading gallery:', err);
    } finally {
      setLoadingGallery(false);
    }
  }, [hasMediaPermission]);

  useEffect(() => {
    onStepChange?.(1);
    loadGallery();
  }, [hasMediaPermission, onStepChange, loadGallery]);

  useFocusEffect(
    useCallback(() => {
      if (hasMediaPermission) {
        loadGallery();
      }
    }, [hasMediaPermission, loadGallery])
  );

  const onSelectMedia = (id: string) => {
    setSelectedMedia(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const handleTakePhoto = useCallback(async () => {
    try {
      const photo = await mediaService.takePhoto();
      
      if (photo) {
        try {
          await MediaLibrary.saveToLibraryAsync(photo.uri);
        } catch (saveErr) {
        }
        
        await loadGallery();
        
        const updatedGallery = await (async () => {
          const assets = await MediaLibrary.getAssetsAsync({
            mediaType: ['photo', 'video'],
            sortBy: [['creationTime', false]],
            first: 1,
          });
          
          if (assets.assets.length > 0) {
            const latestAsset = assets.assets[0];
            try {
              const assetInfo = await MediaLibrary.getAssetInfoAsync(latestAsset.id, {
                shouldDownloadFromNetwork: false,
              });
              return {
                id: latestAsset.id,
                uri: assetInfo.localUri || latestAsset.uri,
                mediaType: 'photo' as const,
                duration: undefined,
              };
            } catch (err) {
              return {
                id: latestAsset.id,
                uri: latestAsset.uri,
                mediaType: 'photo' as const,
                duration: undefined,
              };
            }
          }
          return null;
        })();
        
        if (updatedGallery) {
          setSelectedMedia(prev => {
            if (!prev.includes(updatedGallery.id)) {
              return [updatedGallery.id, ...prev];
            }
            return prev;
          });
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
    }
  }, [loadGallery]);

  const goNext = () => {
    if (selectedMedia.length === 0) return;
    router.push({
      pathname: '/create/posts/publish',
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
      onGoToCamera={handleTakePhoto}
      onScrollBeginDrag={() => {}}
      onScroll={() => {}}
      onScrollEndDrag={() => {}}
      onSelectMedia={onSelectMedia}
      onNext={goNext}
    />
  );
}