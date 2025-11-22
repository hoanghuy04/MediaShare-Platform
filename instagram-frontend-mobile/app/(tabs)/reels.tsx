import { StyleSheet, View, StatusBar } from 'react-native';
import React from 'react';
import ReelComponent from '../../components/reels/ReelComponent';
import { SafeAreaView } from 'react-native-safe-area-context';

const Reels = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      <ReelComponent />
    </SafeAreaView>
  );
};

export default Reels;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
});
