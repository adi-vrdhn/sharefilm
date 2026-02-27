# Film Share

Full-stack app for sharing movie recommendations with friends.

# FilmShare

Full-stack app for sharing movie recommendations with friends. Available as web and mobile apps (iOS/Android).

## Tech Stack
- **Web Frontend**: React + Vite + Tailwind CSS
- **Mobile Frontend**: React Native + Expo (iOS/Android)
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Auth**: JWT + Google OAuth
- **API**: TMDB for movie data

## 🚀 Quick Start

### Web Development
```bash
# Server
cd server && npm install && npm run dev

# Client (in new terminal)
cd client && npm install && npm run dev
```

### Mobile Development
```bash
# Install Expo CLI
npm install -g expo-cli

# Setup mobile app
cd mobile && npm install

# Run on device/simulator
npm start     # Then scan QR code
npm run ios   # iOS Simulator
npm run android # Android Emulator
```

## 📱 Mobile Deployment

### iOS App Store
```bash
cd mobile
npm run build:ios
npm run submit:ios
```

### Google Play Store
```bash
cd mobile
npm run build:android
npm run submit:android
```

See [mobile/README.md](mobile/README.md) for detailed deployment guide.

## Environment Variables

### Server (.env)
```
DATABASE_URL=postgres://...
JWT_SECRET=your_secret
TMDB_API_KEY=your_key
CLIENT_ORIGIN=http://localhost:5173
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### Client Web (.env)
```
VITE_API_URL=http://localhost:4000
VITE_TMDB_KEY=your_key
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### Mobile (.env)
```
EXPO_PUBLIC_API_URL=http://localhost:4000
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

## 🔐 Google OAuth Setup

1. Create OAuth credentials at [Google Cloud Console](https://console.cloud.google.com)
2. Add authorized origins:
   - Web: `http://localhost:5173`
   - Mobile iOS: `com.filmshare.app`
   - Mobile Android: `com.filmshare.app`
3. Add client ID to all `.env` files

## 📋 Project Structure
```
filmshare/
├── client/          # React web app
├── server/          # Node.js backend
├── mobile/          # React Native Expo app
└── scripts/         # Build & utility scripts
```

## 📄 License
MIT
