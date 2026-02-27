import 'expo-dev-client';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useFonts } from 'expo-font';
import { Ionicons, MaterialCommunityIcons, Feather, MaterialIcons, FontAwesome, AntDesign } from '@expo/vector-icons';
import { useAudioPlayer } from './src/hooks/useAudioPlayer';
import PlayerScreen from './src/screens/PlayerScreen';
import AlbumScreen from './src/screens/AlbumScreen';
import PlaylistScreen from './src/screens/PlaylistScreen';
import LikedSongsScreen from './src/screens/LikedSongsScreen';
import TabNavigator from './src/navigation/TabNavigator';

export type RootStackParamList = {
  Tabs: undefined;
  Player: undefined;
  Album: { albumId: string };
  Playlist: { playlistId: string };
  LikedSongs: undefined;
};

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

const Stack = createStackNavigator<RootStackParamList>();

function AppContent() {
  useAudioPlayer();
  return (
    <>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={TabNavigator} />
        <Stack.Screen
          name="Player"
          component={PlayerScreen}
          options={{ presentation: 'modal', gestureEnabled: true }}
        />
        <Stack.Screen
          name="Album"
          component={AlbumScreen}
          options={{ gestureEnabled: true }}
        />
        <Stack.Screen
          name="Playlist"
          component={PlaylistScreen}
          options={{ gestureEnabled: true }}
        />
        <Stack.Screen
          name="LikedSongs"
          component={LikedSongsScreen}
          options={{ gestureEnabled: true }}
        />
      </Stack.Navigator>
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
    ...MaterialCommunityIcons.font,
    ...Feather.font,
    ...MaterialIcons.font,
    ...FontAwesome.font,
    ...AntDesign.font,
  });

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer ref={navigationRef}>
          <AppContent />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}