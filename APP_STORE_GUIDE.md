# App Store Submission Guide

Complete guide for building and submitting FilmShare to iOS App Store and Google Play Store.

## 📋 Prerequisites

### For Both Platforms
- Node.js 18+ and npm
- Expo CLI: `npm install -g expo-cli`
- EAS CLI: `npm install -g eas-cli`
- An Expo account (free at https://expo.dev)

### For iOS
- Mac with Xcode installed
- Apple Developer Program membership ($99/year)
- Apple ID

### For Android
- Android SDK (via Android Studio)
- Google Play Developer account ($25 one-time fee)

## 🎯 iOS App Store Submission

### Step 1: Create App Store Connect Record

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Sign in with Apple ID
3. Click "My Apps" → "Create App"
4. Fill in:
   - Platform: iOS
   - App Name: "FilmShare"
   - Bundle ID: `com.filmshare.app` (match app.json)
   - SKU: anything unique (e.g., filmshare-001)
5. Select the bundle ID → Next
6. Fill in agreement details

### Step 2: Prepare App Information

In [App Store Connect](https://appstoreconnect.apple.com):

1. **General Information**
   - Name: "FilmShare"
   - Subtitle: "Gift movies to friends"
   - Promotional Text: "Share movie recommendations and create your perfect watchlist"
   - Description: See below

2. **Screenshots** (3-5 for each device type)
   - iPhone: 1242×2208 pixels
   - iPad: 2048×2732 pixels

3. **Category**
   - Select: Entertainment

4. **Keywords**
   - movies, recommendations, friends, watchlist, streaming, films

**Example Description:**
```
FilmShare is the easiest way to recommend movies to your friends.

Simply add a movie title, select a friend, and send your recommendation. 
Keep track of what you want to watch and discover new films your friends love.

Features:
• Send movie recommendations to friends
• Build your personal watchlist
• Discover recommendations from friends
• Google Sign-in for easy access
• Real-time notifications

Share the joy of cinema with FilmShare!
```

### Step 3: Setup Code Signing

```bash
cd mobile
eas credential
```

Follow prompts to:
1. Create App Store Connect API Key
2. Create iOS Distribution Certificate
3. Create Provisioning Profile

### Step 4: Build for iOS

```bash
npm run build:ios
```

This will:
1. Build the app in the cloud
2. Generate an .ipa file
3. Upload to TestFlight (optional)

### Step 5: Test on TestFlight

```bash
# Upload to TestFlight
eas build --platform ios --auto-submit
```

1. Add testers in App Store Connect
2. Send them the TestFlight link
3. Collect feedback

### Step 6: Submit for Review

In App Store Connect:

1. Go to your app → "App Information"
2. Fill in all required fields
3. Select "Prepare for Submission"
4. Upload privacy policy and terms of service
5. Select "Submit for Review"

**Review usually takes 24-48 hours**

## 🎮 Google Play Store Submission

### Step 1: Create Play Console App

1. Go to [Google Play Console](https://play.google.com/console)
2. Create new app
3. Enter:
   - Language: English
   - App name: "FilmShare"
   - Default language: English
   - Type: App then Entertainment

### Step 2: App Details

Fill in:
- App description (see iOS section above)
- Screenshots: 1080×1920 PNG (3-5 images)
- Feature graphic: 1024×500 PNG
- App category: Entertainment
- Content rating: Complete questionnaire
- Target audience: 13+

### Step 3: Create Signing Key

```bash
cd mobile
eas credential
```

Choose:
1. Save Android Keystore
2. Generate new one

### Step 4: Build for Android

```bash
npm run build:android
```

### Step 5: Test on Google Play Internal Testing

1. Go to Google Play Console → Testing → Internal testing
2. Create release with .aab file
3. Add testers (Google account emails)
4. Send test link

### Step 6: Create Production Release

In Google Play Console:

1. Go to "Release" → "Production"
2. Create new release
3. Upload .aab file
4. Review all details
5. Click "Review and publish"

**Initial review can take up to 24 hours**

## 🔄 Updates & New Releases

### Web App
```bash
# Update version in client/package.json
# Deploy to hosting service
cd client && npm run build
```

### Mobile Apps
```bash
# Update version in mobile/app.json
# Increment version code/number

# iOS
npm run build:ios

# Android
npm run build:android
```

Updates go through the same review process.

## 📊 Monitoring

### After Launch

Track in:
- [App Store Connect](https://appstoreconnect.apple.com) → Analytics
- [Google Play Console](https://play.google.com/console) → Analytics

Monitor:
- Downloads
- Crashes
- User reviews
- Retention

## 🆘 Common Issues

### iOS
- **Code signing failure**: Run `eas credential` again
- **App rejected**: Check Apple guidelines for app review
- **Build fails**: Clear `node_modules` and reinstall

### Android
- **Build fails**: Ensure Java SDK is installed
- **Upload fails**: Check keystore password
- **App crashes**: Check device compatibility

## 📱 Device Testing Recommendations

Before submission, test on:
- iOS: iPhone 15, iPhone 13
- Android: Pixel 8, Samsung Galaxy S24

Test features:
- Authentication (email and Google login)
- Adding/viewing movies
- Friend management
- Notifications
- Offline handling

## 🎉 Launch Checklist

- [ ] All app information filled in App Store Connect/Play Console
- [ ] Screenshots added and approved
- [ ] Privacy policy published
- [ ] App reviewed by team
- [ ] TestFlight/Internal testing completed
- [ ] Version number incremented
- [ ] Build successful locally
- [ ] No console errors or warnings
- [ ] Update README with App Store links
- [ ] Prepare launch announcement

## 📞 Support Links

- [Apple App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policies](https://play.google.com/about/developer-content-policy/)
- [Expo Submit Documentation](https://docs.expo.dev/submit/ios/)
- [EAS Build Guide](https://docs.expo.dev/eas-update/introduction/)

---

**Questions?** Visit [Expo Community Discord](https://discord.gg/expo) or check [GitHub Issues](https://github.com/adi-vrdhn/sharefilm/issues)
