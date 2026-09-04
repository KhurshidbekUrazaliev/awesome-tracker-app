# Deployment Guide

## Prerequisites

- Node.js 18+ installed
- Git installed
- GitHub account

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

## Step 4: Deploy to GitHub Pages

```bash
# Build the web app (baked with the GitHub Pages public URL)
npm run build:web

# Publish the dist/ folder to the gh-pages branch
npm run deploy:web
```

Then, in your repository on GitHub:

1. Go to Settings → Pages
2. Under "Build and deployment", set Source to "Deploy from a branch"
3. Select the `gh-pages` branch, `/ (root)` folder
4. Save — your app will be live at `https://YOUR_USERNAME.github.io/awesome-tracker-app`

## Step 5: Configure Environment Variables

Client-side environment variables must be prefixed with `EXPO_PUBLIC_` (see `.env.example`) and are baked into the build at build time — set them before running `npm run build:web`:

```bash
EXPO_PUBLIC_API_URL=https://your-api.example.com/api npm run build:web
```

## Step 6: Test Your Deployment

Your app will be live at: `https://YOUR_USERNAME.github.io/awesome-tracker-app`

## Continuous Deployment

Re-run `npm run build:web && npm run deploy:web` (or wire these into a GitHub Actions workflow) whenever you want to publish a new build to `main`.

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

### Build Fails
- Check that all dependencies are in `package.json`
- Ensure `node` version is compatible
- Check the `npm run build:web` output for errors

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
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- Project GitHub Issues
