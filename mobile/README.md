# FilmShare Mobile App

A React Native Expo app for iOS and Android that lets you gift movies to friends.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- For iOS: Mac with Xcode
- For Android: Android SDK or Android Studio

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```

3. **Update `.env` with your settings:**
   ```
   EXPO_PUBLIC_API_URL=http://localhost:4000
   EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
   ```

### Development

**Run on your phone (fastest):**
```bash
npm start
```
Then scan the QR code with Expo Go app (iOS/Android)

**Run on iOS Simulator:**
```bash
npm run ios
```

**Run on Android Emulator:**
```bash
npm run android
```

## 📱 Building for App Stores

### iOS App Store

1. **Setup Apple Developer Account** at [developer.apple.com](https://developer.apple.com)

2. **Create App ID** in App Store Connect

3. **Setup Certificates & Provisioning:**
   ```bash
   eas credential
   ```

4. **Build for iOS:**
   ```bash
   npm run build:ios
   ```

5. **Submit to App Store:**
   ```bash
   npm run submit:ios
   ```

### Google Play Store

1. **Setup Google Play Developer Account** at [play.google.com/console](https://play.google.com/console)

2. **Create App Signing Key:**
   ```bash
   eas credential
   ```

3. **Build for Android:**
   ```bash
   npm run build:android
   ```

4. **Submit to Play Store:**
   ```bash
   npm run submit:android
   ```

## 📋 Deployment Checklist

- [ ] Update app version in `app.json`
- [ ] Update privacy policy link
- [ ] Add app screenshots (1242x2208 for iOS, 1080x1920 for Android)
- [ ] Write compelling app description
- [ ] Configure push notifications (optional)
- [ ] Test on real devices
- [ ] Review all app store guidelines
- [ ] Submit for review

## 🔧 Configuration

### EAS Setup

Update `eas.json` with:
- iOS: App Store Connect App ID
- Android: Google Play Console package name

### Google OAuth

1. Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com)
2. Add bundle IDs:
   - iOS: `com.filmshare.app`
   - Android: `com.filmshare.app`
3. Update `EXPO_PUBLIC_GOOGLE_CLIENT_ID` in `.env`

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev)
- [EAS Build Guide](https://docs.expo.dev/eas-update/introduction/)
- [App Store Distribution](https://docs.expo.dev/submit/ios/)
- [Google Play Distribution](https://docs.expo.dev/submit/android/)

## 📄 License

MIT
