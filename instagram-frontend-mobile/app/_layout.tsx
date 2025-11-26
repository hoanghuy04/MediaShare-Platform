import { Stack } from 'expo-router';
import { AuthProvider } from '@context/AuthContext';
import { ThemeProvider } from '@context/ThemeContext';
import { AppProvider } from '@context/AppContext';
import { PostCreationProvider } from '@hooks/usePostCreation';
import { ErrorBoundary } from '@components/common/ErrorBoundary';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { UploadProvider } from '@/context/UploadContext';
import { NotificationProvider } from '@/context/NotificationContext';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <ThemeProvider>
          <UploadProvider>
            <AuthProvider>
              <AppProvider>
                <NotificationProvider>
                  <PostCreationProvider>
                    <Stack screenOptions={{ headerShown: false }}>
                      <Stack.Screen name="(auth)" />
                      <Stack.Screen name="(tabs)" />
                      <Stack.Screen name="create" />
                      <Stack.Screen name="search" />
                      <Stack.Screen name="posts/[id]" />
                      <Stack.Screen name="users/[id]" />
                      <Stack.Screen name="messages/[conversationId]" />
                      <Stack.Screen name="join/[token]" />
                      <Stack.Screen name="notifications" />
                    </Stack>
                  </PostCreationProvider>
                </NotificationProvider>
              </AppProvider>
            </AuthProvider>
          </UploadProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </GestureHandlerRootView >
  );
}