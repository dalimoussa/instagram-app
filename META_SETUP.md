# 🔑 Meta Developer Setup Guide

How to create a Meta/Facebook App for Instagram posting.

## What You Need

- Facebook account
- Instagram Business account (convert from Settings → Account → Switch to Professional Account)
- Facebook Page connected to your Instagram

---

## Step 1: Create Meta App

1. Go to: https://developers.facebook.com
2. Click **"My Apps"** in top right
3. Click **"Create App"**
4. Select **"Business"** type → Click **"Next"**
5. Fill in:
   - **App Name**: "Instagram AutoPoster" (or any name)
   - **App Contact Email**: your email
   - Click **"Create App"**

---

## Step 2: Add Instagram Basic Display

1. In your app dashboard, scroll to **"Add Products"**
2. Find **"Instagram Basic Display"** → Click **"Set Up"**
3. Scroll down to **"User Token Generator"**
4. Click **"Add or Remove Instagram Testers"**
5. Click **"Add Instagram Testers"**
6. Enter your Instagram username → Click **"Submit"**
7. Go to your Instagram app → Settings → Apps and Websites
8. Accept the tester invite

---

## Step 3: Configure Instagram Graph API

1. In app dashboard, find **"Instagram Graph API"** → Click **"Set Up"**
2. (If not available, add **"Instagram Basic Display"** first)
3. In the left menu, click **"App Settings"** → **"Basic"**
4. Copy these values (you'll need them):
   - **App ID**: `1234567890` (example)
   - **App Secret**: Click **"Show"** → Copy the secret

---

## Step 4: Add Redirect URIs

1. Still in **"Basic"** settings, scroll to **"App Domains"**
2. Add: `localhost`
3. Scroll to **"Website"** → Click **"Add Platform"** → **"Website"**
4. Site URL: `http://localhost:3000`
5. In **Instagram Graph API** settings:
   - Find **"OAuth Redirect URIs"** (or "Valid OAuth Redirect URIs")
   - Add these URLs:
     ```
     http://localhost:3000/api/v1/auth/instagram/callback
     https://YOUR_NGROK_URL/api/v1/auth/instagram/callback
     ```
     (Replace YOUR_NGROK_URL with your ngrok URL from installation)
6. Click **"Save Changes"**

---

## Step 5: Get Permissions

1. In left menu, click **"App Review"** → **"Permissions and Features"**
2. Request these permissions:
   - `instagram_basic` → Click **"Get Advanced Access"**
   - `instagram_content_publish` → Click **"Get Advanced Access"**
   - `pages_read_engagement` → Click **"Get Advanced Access"**
   - `pages_show_list` → Click **"Get Advanced Access"**
   - `instagram_manage_insights` → Click **"Get Advanced Access"**

**Note:** For development, "Standard Access" is enough. For production with multiple users, you need "Advanced Access" (requires app review).

---

## Step 6: Make App Live

1. In top right, switch app mode from **"Development"** to **"Live"**
2. If it asks for **Privacy Policy URL**:
   - You can use a temporary one: `https://www.termsfeed.com/privacy-policy-generator/`
   - Or: `http://localhost:3000/privacy` (create a simple page)
3. Click **"Switch Mode"**

---

## Step 7: Setup Google Cloud (for Google Drive)

1. Go to: https://console.cloud.google.com
2. Click **"Select a project"** → **"New Project"**
3. Name: "Instagram AutoPoster" → Click **"Create"**
4. In the dashboard, click **"APIs & Services"** → **"Enable APIs and Services"**
5. Search and enable:
   - **Google Drive API** → Click **"Enable"**
   - **Google Sheets API** → Click **"Enable"** (optional, for licenses)
6. Click **"Create Credentials"** → **"OAuth client ID"**
7. Configure consent screen:
   - User Type: **External** → Click **"Create"**
   - App name: "Instagram AutoPoster"
   - User support email: your email
   - Developer contact: your email
   - Click **"Save and Continue"** through all steps
8. Back to **"Create Credentials"** → **"OAuth client ID"**
   - Application type: **Web application**
   - Name: "AutoPoster Backend"
   - Authorized redirect URIs:
     ```
     http://localhost:3000/api/v1/auth/google/callback
     https://YOUR_NGROK_URL/api/v1/auth/google/callback
     ```
   - Click **"Create"**
9. Copy:
   - **Client ID**: `1234567890-abc123.apps.googleusercontent.com`
   - **Client Secret**: `GOCSPX-abc123xyz`

---

## Step 8: Add Credentials to .env File

Update your `backend/.env` file:

```env
# Meta/Instagram
META_APP_ID="1234567890"
META_APP_SECRET="abc123xyz789"
META_REDIRECT_URI="https://YOUR_NGROK_URL/api/v1/auth/instagram/callback"

# Google
GOOGLE_CLIENT_ID="1234567890-abc123.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-abc123xyz"
GOOGLE_REDIRECT_URI="https://YOUR_NGROK_URL/api/v1/auth/google/callback"
```

**Important:** Replace `YOUR_NGROK_URL` with your actual ngrok URL (example: `https://abc123.ngrok.io`)

---

## ✅ Setup Complete!

Your Meta App is ready to use with Instagram!

### Example Values:

```env
# Example (DO NOT USE THESE - use your own!)
META_APP_ID="123456789012345"
META_APP_SECRET="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
META_REDIRECT_URI="https://abc123.ngrok.io/api/v1/auth/instagram/callback"

GOOGLE_CLIENT_ID="123456789012-abcdefghijklmnop.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-1A2B3C4D5E6F7G8H9I0J"
GOOGLE_REDIRECT_URI="https://abc123.ngrok.io/api/v1/auth/google/callback"
```

---

## 🔍 Troubleshooting

### "Redirect URI mismatch" error
- Make sure ngrok URL in .env matches the one in Meta App settings
- Check both http://localhost:3000 AND https://ngrok-url are added
- Restart backend after changing .env

### "Invalid App ID" error
- Check META_APP_ID matches exactly (no spaces)
- Make sure app is in "Live" mode, not "Development"

### Can't connect Instagram account
- Make sure Instagram account is a Business or Creator account
- Make sure Instagram is connected to a Facebook Page
- Check permissions are granted in Meta App

### Google Drive not working
- Make sure Google Drive API is enabled in Google Cloud Console
- Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correct
- Make sure redirect URI matches exactly

---

## 📸 Where to Find Things:

### Meta App ID & Secret:
1. Go to: https://developers.facebook.com/apps
2. Click your app
3. Click "Settings" → "Basic"
4. See "App ID" and "App Secret"

### Instagram Permissions:
1. Go to: https://developers.facebook.com/apps
2. Click your app
3. Click "App Review" → "Permissions and Features"

### Google Credentials:
1. Go to: https://console.cloud.google.com
2. Click your project
3. Click "APIs & Services" → "Credentials"
4. See your OAuth 2.0 Client IDs

---

**Done!** You can now connect Instagram accounts in the app.
