import ReelCard from '@/components/reels/ReelCard';
import { useAuth } from '@/context/AuthContext';
import { postAPI } from '@/services/api';
import { Post } from '@/types';
import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { SwiperFlatList } from 'react-native-swiper-flatlist';

const ReelList = () => {
  const { user } = useAuth();
  const [reels, setReels] = useState<Post[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleChangeIndexValue = ({ index }: { index: number; prevIndex: number }) => {
    setCurrentIndex(index);
  };

  useEffect(() => {
    if (!user || !user.id) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập để chia sẻ Reel.');
      return;
    }
    const loadReels = async () => {
      const fetchedReels = await postAPI.getFeed().then(res => {
        console.log('Fetched reels:', res.content);
        setReels(res.content);
      });
      console.log('Reels loaded:', fetchedReels);
    };
    loadReels();
  }, []);

  return (
    <SwiperFlatList
      data={reels}
      renderItem={({ item, index }) => (
        <ReelCard item={item} index={index} currentIndex={currentIndex} />
      )}
      onChangeIndex={handleChangeIndexValue}
      vertical
      keyExtractor={(item, index) => index.toString()}
    />
  );
};
export default ReelList;
