# 🎯 Quick Start Guide for Client

## What Is This?

This is an Instagram automation system that:
- Posts to Instagram automatically from Google Drive
- Manages up to 100 Instagram business accounts
- Tracks analytics and performance
- Schedules posts for any time

---

## ⚡ Super Quick Start (3 Steps)

### 1️⃣ Install Everything
Open `INSTALLATION.md` and follow all steps (takes 30 minutes)

### 2️⃣ Setup Instagram & Google
Open `META_SETUP.md` and create:
- Meta Developer account (for Instagram)
- Google Cloud account (for Google Drive)

### 3️⃣ Start the App
Double-click `start-servers.ps1` or run in terminal:
```bash
.\start-servers.ps1
```

Open browser: **http://localhost:5173**

---

## 📱 How to Use (5 Steps)

### Step 1: Register Account
1. Open http://localhost:5173
2. Click "Register"
3. Enter email and password
4. Click "Create Account"

### Step 2: Connect Instagram
1. Login to the app
2. Click "Accounts" in sidebar
3. Click "Connect Instagram"
4. Login with Instagram business account
5. Done! ✅

### Step 3: Link Google Drive
1. Click "Themes" in sidebar
2. Click "Create Theme"
3. Name it (e.g., "My Videos")
4. Click "Connect Google Drive"
5. Select folder with your videos/images
6. Click "Create"
7. Done! ✅

### Step 4: Schedule Posts
1. Click "Schedules" in sidebar
2. Click "Schedule Post"
3. Fill in:
   - Name: "Daily Post"
   - Date & Time: When to post
   - Theme: Select your Google Drive folder
   - Caption: Write your post text
   - Accounts: Select Instagram account(s)
4. Click "Create Schedule"
5. Done! ✅

### Step 5: Watch It Work
- **Auto**: System posts automatically at scheduled time
- **Manual**: Click "Execute Now" to post immediately
- **Check**: Go to "Posts" page to see published posts
- **Analytics**: Click "Analytics" to see performance

---

## 🆘 Common Issues

### "Can't connect to database"
→ Make sure PostgreSQL is installed and running
→ Check password in `backend/.env` file

### "Instagram login doesn't work"
→ Make sure your ngrok is running
→ Check `META_SETUP.md` step 4 (Redirect URIs)
→ Make sure Instagram account is Business account

### "Google Drive won't connect"
→ Make sure Google Drive API is enabled
→ Check `META_SETUP.md` step 7

### "Servers won't start"
→ Make sure Node.js is installed: `node --version`
→ Make sure you ran `npm install` in both folders
→ Check that ports 3000 and 5173 are not in use

---

## 📁 File Structure (What's What)

```
📁 Project Folder/
├── 📄 README.md              ← You are here!
├── 📄 INSTALLATION.md        ← Installation guide
├── 📄 META_SETUP.md          ← Instagram & Google setup
├── 📄 REQUIREMENTS.md        ← What you need to install
├── 📄 start-servers.ps1      ← Double-click to start
├── 📁 backend/               ← Server (don't touch)
└── 📁 frontend/              ← Website (don't touch)
```

---

## 🔐 Important Files

### backend/.env
Contains your secret keys (Instagram, Google, Database)
**Keep this file private!** Never share it.

### frontend/.env
Contains your API URL
Simple config file.

---

## 💡 Tips

1. **Always start ngrok first** before starting servers
   ```bash
   ngrok http 3000
   ```

2. **Keep ngrok running** while using the app

3. **Update .env files** if ngrok URL changes

4. **Instagram Business Account required** - normal Instagram won't work

5. **Facebook Page required** - Instagram must be connected to a Facebook Page

6. **Use good WiFi** - uploads require stable internet

---

## 📊 What Can You Do?

✅ **Manage 100 Instagram accounts** (license default)
✅ **Schedule 200 posts** at once
✅ **Post 500 times per month**
✅ **Auto-select from Google Drive** (no manual uploads)
✅ **Track analytics** (views, likes, comments)
✅ **Bulk operations** (pause/resume multiple schedules)
✅ **Caption templates** (save time writing)
✅ **Weekly calendar view** (see all scheduled posts)
✅ **Export reports** (CSV or PDF)

---

## 🎓 Learning Path

1. **Day 1**: Install everything, connect 1 account
2. **Day 2**: Create theme, schedule 1 test post
3. **Day 3**: Add more accounts, create multiple schedules
4. **Day 4**: Check analytics, export reports
5. **Day 5**: Master bulk operations and templates

---

## ⚙️ System Requirements

- Windows 10+, Mac, or Linux
- 4GB RAM minimum (8GB better)
- 2GB free disk space
- Good internet connection
- Instagram Business Account
- Facebook Page
- Google Drive account

---

## 🚀 Ready to Start?

1. Read `REQUIREMENTS.md` - see what you need
2. Follow `INSTALLATION.md` - install everything
3. Follow `META_SETUP.md` - setup Instagram & Google
4. Run `start-servers.ps1` - start the app
5. Open http://localhost:5173 - use the app!

---

**Need Help?**

If you have trouble:
1. Re-read the error message carefully
2. Check the relevant .md file for your issue
3. Make sure all software is installed (Node, PostgreSQL, Redis)
4. Make sure ngrok is running
5. Check .env files have correct values

---

**Everything is ready to use! Good luck! 🎉**
