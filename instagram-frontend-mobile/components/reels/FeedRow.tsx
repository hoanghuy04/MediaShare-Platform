import { StyleSheet, View } from 'react-native';
import React from 'react';
import VideoComponent from './VideoComponent';
import FeedFooter from './FeedFooter';
import FeedSideBar from './FeedSideBar';
import { PostResponse } from '../../types/post.type';

interface FeedRowProps {
  data: PostResponse;
  index: number;
  isVisible: boolean;
  isNext: boolean;
  height: number;
}

const FeedRow = ({ data, index, isVisible, isNext, height }: FeedRowProps) => {
  return (
    <View style={[styles.container, { height: height }]}>
      <VideoComponent data={data} isVisible={isVisible} />
      <FeedSideBar data={data} />
      <FeedFooter data={data} />
    </View>
  );
};

export default FeedRow;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: 'black',
    overflow: 'hidden',
  },
});
