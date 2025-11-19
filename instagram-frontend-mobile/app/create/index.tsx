import { CreateTabbedFlow } from '@/components/create/CreateTabbedFlow';
import { useRouter } from 'expo-router';

export default function CreatePage() {
  const router = useRouter();
  
  const handlePostCreated = () => {
    router.replace('/(tabs)/feed');
  };

  return <CreateTabbedFlow onPostCreated={handlePostCreated} />;
}
