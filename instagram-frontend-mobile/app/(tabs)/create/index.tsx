import { CreateTabbedFlow } from '@/components/create/CreateTabbedFlow';
import { useRouter } from 'expo-router';

export default function CreatePage() {
  const router = useRouter();
  
  const handlePostCreated = () => {
    // Trigger refresh feed by navigating to feed and back
    // This will cause the feed to refresh
    console.log('Post created, should refresh feed');
  };

  return <CreateTabbedFlow onPostCreated={handlePostCreated} />;
}
