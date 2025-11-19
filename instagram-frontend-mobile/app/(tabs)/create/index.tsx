import { useEffect } from 'react';
import { router } from 'expo-router';

export default function CreatePage() {
  useEffect(() => {
    // Tự động redirect đến pick-media khi vào create
    router.replace('/(tabs)/create/posts/pick-media');
  }, []);

  return null;
}
