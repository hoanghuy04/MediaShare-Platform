import { useEffect } from 'react';
import { router } from 'expo-router';

export default function PostsIndex() {
  useEffect(() => {
    router.replace('./pick-media');
  }, []);

  return null;
}
