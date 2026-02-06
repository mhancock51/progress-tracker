# Google Single Sign-On Setup

## Steps to Configure

### 1. Use Your Existing Google Cloud Project
You already have a project set up for Gmail API. We'll add OAuth credentials for the web app.

### 2. Create Web Application Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Navigate to **"APIs & Services"** → **"Credentials"**
4. Click **"Create Credentials"** → **"OAuth client ID"**
5. Application type: **"Web application"**
6. Name: "Progress Tracker Web"
7. Authorized JavaScript origins:
   - `http://localhost:3000`
   - Add your production URL later
8. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - Add your production URL later: `https://yourdomain.com/api/auth/callback/google`
9. Click **"Create"**
10. Copy the **Client ID** and **Client Secret**

### 3. Update Environment Variables

Update your `.env.local`:

```env
GOOGLE_CLIENT_ID=paste-your-client-id-here
GOOGLE_CLIENT_SECRET=paste-your-client-secret-here
```

### 4. Restart Your Dev Server

```bash
npm run dev
```

### 5. Test Sign In

1. Visit `http://localhost:3000`
2. You'll be redirected to sign in
3. Click "Sign in with Google"
4. Sign in with `matt.hancock233@gmail.com`
5. You should be redirected back to the app

**Anyone else trying to sign in will see an "Access Denied" error.**

## Security

- Only `matt.hancock233@gmail.com` can access the app
- All routes are protected by middleware
- Session uses JWT tokens
- Secret key is cryptographically secure

## For Production

1. Create OAuth credentials with your production URL
2. Add environment variables to your hosting provider (Vercel, etc.)
3. Update the authorized domains in Google Cloud Console
