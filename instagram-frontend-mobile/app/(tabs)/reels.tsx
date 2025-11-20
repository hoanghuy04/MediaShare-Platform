import { StyleSheet, View } from 'react-native';
import React from 'react';
import ReelComponent from '../../components/reels/ReelComponent';

const Reels = () => {
  return (
    <View style={styles.container}>
      <ReelComponent />
    </View>
  );
};

export default Reels;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
});
