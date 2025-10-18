# Instagram Mobile App

A simplified Instagram-like mobile application built with Expo, React Native, and TypeScript.

## 📋 Features

- **Authentication**: Login, Register, Forgot Password
- **Feed**: Infinite scrolling feed with posts from followed users
- **Explore**: Discover new content and users
- **Create**: Upload photos and videos with captions
- **Messages**: Direct messaging with real-time updates
- **Profile**: View and edit user profiles
- **Interactions**: Like, comment, and share posts
- **Dark Mode**: Automatic theme switching support

## 🛠️ Tech Stack

- **Framework**: Expo SDK 54
- **Language**: TypeScript
- **Navigation**: Expo Router (File-based routing)
- **State Management**: Zustand
- **API Client**: Axios
- **UI Components**: Custom components with React Native
- **Storage**: Expo SecureStore & AsyncStorage
- **Media**: Expo Image Picker & Image Manipulator
- **Notifications**: Expo Notifications

## 📁 Project Structure

```
instagram-frontend-mobile/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main tab navigation
│   ├── posts/             # Post detail screens
│   ├── users/             # User profile screens
│   └── messages/          # Chat screens
├── components/            # Reusable components
│   ├── common/           # Common UI components
│   ├── feed/             # Feed-related components
│   ├── explore/          # Explore screen components
│   ├── create/           # Post creation components
│   ├── messages/         # Messaging components
│   └── profile/          # Profile components
├── hooks/                # Custom React hooks
├── context/              # React Context providers
├── services/             # API and service layer
├── store/                # Zustand state stores
├── types/                # TypeScript type definitions
├── utils/                # Utility functions
├── styles/               # Theme and styling
├── config/               # App configuration
└── assets/               # Images, icons, fonts

```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Backend API running at `http://localhost:3000`

### Installation

1. **Clone the repository**
   ```bash
   cd InstagramApplication/instagram-frontend-mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   
   The app is pre-configured to connect to `http://localhost:3000`. To change this, edit:
   - `config/apiConfig.ts`

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on your device**
   - **iOS**: Press `i` or scan QR code with Camera app
   - **Android**: Press `a` or scan QR code with Expo Go app
   - **Web**: Press `w`

## 📱 Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS simulator (macOS only)
- `npm run web` - Run in web browser
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## 🔧 Configuration

### API Configuration

Update the API endpoints in `config/apiConfig.ts`:

```typescript
const ENV = {
  dev: {
    apiUrl: 'http://localhost:3000',
    wsUrl: 'ws://localhost:3000',
  },
  prod: {
    apiUrl: 'https://your-production-api.com',
    wsUrl: 'wss://your-production-api.com',
  },
};
```

### App Configuration

Modify `app.json` for:
- App name and slug
- App icons and splash screens
- Permissions
- Platform-specific settings

## 📦 Key Dependencies

- `expo` - Expo SDK
- `expo-router` - File-based routing
- `react-native` - React Native framework
- `typescript` - Type safety
- `axios` - HTTP client
- `zustand` - State management
- `@tanstack/react-query` - Data fetching (optional)
- `expo-image-picker` - Image/video selection
- `expo-notifications` - Push notifications
- `expo-secure-store` - Secure storage
- `@react-native-async-storage/async-storage` - Async storage

## 🎨 Theming

The app supports light and dark themes. Theme configuration is in:
- `styles/theme.ts` - Theme definitions
- `styles/colors.ts` - Color palettes
- `context/ThemeContext.tsx` - Theme provider

## 🔐 Authentication

Authentication is handled by:
- `context/AuthContext.tsx` - Auth state and methods
- `services/api.ts` - Auth API calls
- `services/storage.ts` - Token storage

Users are automatically redirected based on auth state.

## 📸 Media Handling

Media upload and processing:
- `services/media.ts` - Media picker and compression
- `components/create/*` - Post creation flow
- Supports images and videos
- Automatic compression and optimization

## 🔔 Notifications

Push notifications setup:
- `services/notifications.ts` - Notification service
- `context/AppContext.tsx` - Notification state
- Configured in `app.json`

## 🗂️ State Management

The app uses multiple state management approaches:
- **Zustand** - Global state (stores/)
- **React Context** - Auth, theme, app state
- **Local State** - Component-level state

## 📡 API Integration

API services are organized in `services/api.ts`:
- `authAPI` - Authentication
- `userAPI` - User management
- `postAPI` - Posts and feed
- `commentAPI` - Comments
- `messageAPI` - Direct messages
- `notificationAPI` - Notifications
- `uploadAPI` - File uploads

## 🧪 Development Tips

1. **Hot Reload**: Changes automatically reload in the app
2. **Debug Menu**: Shake device or press `Cmd+D` (iOS) / `Cmd+M` (Android)
3. **Console Logs**: Use `console.log()` - visible in terminal
4. **Type Safety**: TypeScript provides excellent IDE support
5. **Component Preview**: Use React Native Debugger

## 🐛 Troubleshooting

### Common Issues

**Metro bundler won't start:**
```bash
npm start -- --clear
```

**Dependency issues:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**iOS build issues:**
```bash
cd ios && pod install && cd ..
```

**Android build issues:**
```bash
cd android && ./gradlew clean && cd ..
```

## 🚀 Building for Production

### Android APK
```bash
eas build --platform android
```

### iOS IPA
```bash
eas build --platform ios
```

### Configure EAS Build
Create `eas.json`:
```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

## 📄 License

This project is for educational purposes.

## 🤝 Contributing

This is a demonstration project. Feel free to fork and modify for your needs.

## 📞 Support

For issues and questions:
1. Check the Expo documentation: https://docs.expo.dev
2. React Native docs: https://reactnative.dev
3. Backend API documentation

## 🔄 Backend Connection

Ensure the backend API (`instagram-backend`) is running:
```bash
cd ../instagram-backend
mvn spring-boot:run
```

Default backend URL: `http://localhost:3000`

## 🎯 Next Steps

- Implement real-time messaging with WebSocket
- Add story feature
- Implement video calls
- Add more social features
- Improve offline support
- Add unit and integration tests

---

**Built with ❤️ using Expo and React Native**

