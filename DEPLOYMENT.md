# Deployment Guide

## Prerequisites

- Node.js 18+ installed
- Git installed
- GitHub account
- Vercel account (sign up at https://vercel.com)

## Step 1: Initialize Git Repository

```bash
cd AwesomeProject
git init
git add .
git commit -m "feat: initial commit - complete tracker app"
```

## Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Name your repository: `awesome-tracker-app` (or any name you prefer)
3. Don't initialize with README (we already have one)
4. Click "Create repository"

## Step 3: Push to GitHub

```bash
# Replace YOUR_USERNAME with your GitHub username
git remote add origin https://github.com/YOUR_USERNAME/awesome-tracker-app.git
git branch -M main
git push -u origin main
```

## Step 4: Deploy to Vercel

### Option A: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
cd AwesomeProject
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Select your account
# - Link to existing project? No
# - What's your project's name? awesome-tracker-app
# - In which directory is your code located? ./
# - Want to override settings? No

# Deploy to production
vercel --prod
```

### Option B: Using Vercel Dashboard

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your GitHub repository
4. Click "Import"
5. Vercel will auto-detect settings from `vercel.json`
6. Click "Deploy"

## Step 5: Configure Environment Variables in Vercel

1. Go to your project in Vercel Dashboard
2. Click "Settings" → "Environment Variables"
3. Add your environment variables:
   - `API_URL`: Your backend API URL
   - `WS_URL`: Your WebSocket URL
   - `ENVIRONMENT`: production

## Step 6: Test Your Deployment

Your app will be live at: `https://your-project-name.vercel.app`

## Continuous Deployment

Every push to the `main` branch will automatically trigger a new deployment on Vercel.

## Mobile App Deployment

For iOS and Android:

### iOS (App Store)

```bash
# Build for iOS
eas build --platform ios --profile production

# Submit to App Store
eas submit -p ios
```

### Android (Google Play)

```bash
# Build for Android
eas build --platform android --profile production

# Submit to Google Play
eas submit -p android
```

Note: You'll need to set up EAS (Expo Application Services) first:
```bash
npm install -g eas-cli
eas login
eas build:configure
```

## Troubleshooting

### Build Fails on Vercel
- Check that all dependencies are in `package.json`
- Ensure `node` version is compatible
- Check Vercel build logs

### Environment Variables Not Working
- Make sure they're prefixed with `EXPO_PUBLIC_` for client-side access
- Redeploy after adding variables

### Web App Not Loading
- Clear browser cache
- Check browser console for errors
- Verify API URLs are correct

## Support

For issues, check:
- [Expo Documentation](https://docs.expo.dev)
- [Vercel Documentation](https://vercel.com/docs)
- Project GitHub Issues
