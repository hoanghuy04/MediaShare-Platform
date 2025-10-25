import ReelList from '@/components/reels/ReelList';
import React from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

export default function ReelScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.headerWrapper}>
        <Text style={styles.headerTitle}>Reels</Text>
        {/* <Feather name="camera" style={styles.headerIcon} /> */}
      </View>

      {/* DANH SÁCH VIDEO */}
      <ReelList />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: windowWidth,
    height: windowHeight,
    backgroundColor: 'black',
    position: 'relative',
  },
  headerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,

    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 1,
    padding: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerIcon: {
    fontSize: 25,
    color: 'white',
  },
});
