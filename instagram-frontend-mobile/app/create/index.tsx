import { CreateTabbedFlow } from '@/components/create/CreateTabbedFlow';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function CreatePage() {
  const router = useRouter();

  const handlePostCreated = () => {
    router.replace('/(tabs)/feed');
  };

  return (
    <>
      <StatusBar hidden />
      <CreateTabbedFlow onPostCreated={handlePostCreated} />
    </>
  );
}
