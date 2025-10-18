# 🚀 Quick Start Guide

## ✅ Setup Complete!

Your Instagram mobile app is ready to run. Follow these steps:

## 📱 Step 1: Start the Backend

The mobile app needs the backend API running. Open a **new terminal** and run:

```bash
cd D:\_HK1_Nam4\Mobile\Prj\InstagramApplication\instagram-backend
mvn spring-boot:run
```

Wait for the message: `Started InstagramBackendApplication`

The backend will run at `http://localhost:3000`

## 📲 Step 2: Mobile App is Already Running

Your Expo dev server is already running! You should see:

- QR code in the terminal
- Options to press keys (a, i, w)

## 🎮 Step 3: Choose Your Platform

### Option A: Android Emulator (Recommended)
1. Open Android Studio
2. Start an Android emulator
3. In the Expo terminal, press **`a`**
4. App will install and launch automatically

**Note**: Android emulator connects to backend at `http://10.0.2.2:3000`

### Option B: Android Physical Device
1. Install **Expo Go** from Play Store
2. Scan the QR code in terminal
3. App will load in Expo Go

**Note**: Your phone must be on the same WiFi as your computer

### Option C: iOS Simulator (macOS only)
1. In the Expo terminal, press **`i`**
2. iOS simulator will launch automatically

### Option D: Web Browser
1. In the Expo terminal, press **`w`**
2. Opens in your default browser

## 🔐 Test Login

Once the app loads, you'll see the login screen. Use these test credentials (or register a new account):

```
Username: testuser
Password: password123
```

Or click "Sign Up" to create a new account.

## 🛠️ Troubleshooting

### "Network Error" when logging in?

**Solution**: Make sure the backend is running!
```bash
cd ../instagram-backend
mvn spring-boot:run
```

### Android emulator not connecting to backend?

**Solution**: The app is configured to use `http://10.0.2.2:3000` for Android emulator, which is correct. Just ensure backend is running.

### Metro bundler errors?

**Solution**: Clear cache and restart
```bash
# Stop current server (Ctrl+C)
npx expo start --clear
```

### Port 8081 already in use?

**Solution**: Kill the existing process or use different port
```bash
npx expo start --port 8082
```

## 📋 Available Features

Once logged in, you can:

- ✅ Browse feed with posts
- ✅ Like, comment, share posts
- ✅ Explore and search
- ✅ Create new posts with photos
- ✅ View and edit your profile
- ✅ Send direct messages
- ✅ Follow/unfollow users
- ✅ Switch between light/dark themes

## ⚠️ Known Limitations in Expo Go

These features require a development build (not available in Expo Go):
- Push notifications
- Full media library access

For development, you can ignore these warnings.

## 📚 Project Structure

```
instagram-frontend-mobile/
├── app/              # Screens (Expo Router)
├── components/       # Reusable UI components
├── services/         # API and services
├── hooks/           # Custom React hooks
├── context/         # React Context providers
├── store/           # Zustand stores
├── types/           # TypeScript types
└── utils/           # Helper functions
```

## 🔄 Development Workflow

1. **Make code changes** - Files auto-reload
2. **Shake device** - Opens debug menu
3. **Check terminal** - See logs and errors
4. **Refresh app** - Press `r` in terminal

## 🎯 Next Steps

1. Explore the codebase
2. Customize colors in `styles/colors.ts`
3. Add more features
4. Build for production with EAS Build

## 💡 Tips

- Use TypeScript for type safety
- Hot reload works for most changes
- Console logs appear in the terminal
- Use React Native Debugger for advanced debugging

## 📞 Need Help?

Check these resources:
- [Expo Documentation](https://docs.expo.dev)
- [React Native Docs](https://reactnative.dev)
- Backend API docs in `instagram-backend/`

---

**Happy Coding! 🎉**

