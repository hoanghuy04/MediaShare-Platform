import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';

type Props = {
  wallpaperUrl?: string;
  overlayColor: string;
  children: React.ReactNode;
};

export const WallpaperWrapper: React.FC<Props> = ({
  wallpaperUrl,
  overlayColor,
  children,
}) => {
  if (!wallpaperUrl) {
    return <>{children}</>;
  }

  return (
    <ImageBackground
      source={{ uri: wallpaperUrl }}
      style={styles.wallpaperBackground}
      blurRadius={0}
    >
      <View
        style={[
          styles.wallpaperOverlay,
          { backgroundColor: overlayColor },
        ]}
      />
      {children}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  wallpaperBackground: { flex: 1 },
  wallpaperOverlay: { ...StyleSheet.absoluteFillObject },
});

