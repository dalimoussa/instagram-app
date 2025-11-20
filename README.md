# 📱 Instagram Auto-Posting System# 📱 Instagram Auto-Posting System



Simple Instagram automation for managing multiple business accounts.Simple Instagram automation platform for managing multiple business accounts.



---## ✨ What This Does



## 🎯 **New User? Start Here!**- 🔄 Automatically post to Instagram from Google Drive folders

- 📊 Track analytics and performance

### 👉 **Open `START_HERE.md`** ← Complete beginner's guide- ⏰ Schedule posts for specific times

- 🎯 Manage up to 100 Instagram business accounts

---- 📁 Link Google Drive folders to different accounts



## ✨ What This Does

## You have to read INSTALLATION.md and META_SETUP.md first before this 

- 🔄 Auto-post to Instagram from Google Drive

- 📊 Track analytics and performance  ## 🚀 Quick Start

- ⏰ Schedule posts for any time

- 🎯 Manage up to 100 Instagram accounts1. **Install everything** → See `INSTALLATION.md`

- 📁 Link Google Drive folders to accounts2. **Setup Meta App** → See `META_SETUP.md`

3. **Start the application**:

---   ```bash

   # Start backend (in first terminal)

## 📚 Documentation Files   cd backend

   npm run start:dev

| File | Purpose |

|------|---------|   # Start frontend (in second terminal)

| **START_HERE.md** | 👈 **Start here!** Complete guide for beginners |   cd frontend

| **REQUIREMENTS.md** | List of software you need to install |   npm run dev

| **INSTALLATION.md** | Step-by-step installation instructions |   ```

| **META_SETUP.md** | How to setup Instagram & Google APIs |4. **Open browser** → http://localhost:5173



---## 📖 How to Use



## ⚡ Quick Start (If You Know What You're Doing)### Step 1: Connect Instagram Account

1. Click **"Accounts"** in sidebar

```bash2. Click **"Connect Instagram"**

# 1. Install: Node.js, PostgreSQL, Redis, Ngrok3. Login with your Instagram business account

# 2. Setup: Meta App, Google Cloud (see META_SETUP.md)4. Account appears in the list ✅

# 3. Install dependencies:

cd backend && npm install### Step 2: Link Google Drive Folder

cd ../frontend && npm install1. Click **"Themes"** in sidebar

2. Click **"Create Theme"**

# 4. Setup database:3. Name it (e.g., "My Videos")

cd backend4. Connect to Google Drive and select folder

npx prisma migrate deploy5. Click **"Create"** ✅



# 5. Start servers:### Step 3: Schedule a Post

.\start-servers.ps11. Click **"Schedules"** in sidebar

2. Click **"Schedule Post"**

# 6. Open: http://localhost:51733. Fill in:

```   - Schedule name

   - Date and time

---   - Select theme (your Drive folder)

   - Write caption

## 📖 How to Use   - Select Instagram account(s)

4. Click **"Create Schedule"** ✅

1. **Connect Instagram** → Login with business account

2. **Link Google Drive** → Select folder with videos/images  ### Step 4: Auto-Post or Manual

3. **Schedule Post** → Set date, time, caption, accounts- **Auto**: Posts automatically at scheduled time

4. **Auto-Post** → System posts at scheduled time ✅- **Manual**: Click "Execute Now" button

5. **Check Analytics** → View performance metrics

### Step 5: Check Results

---- **Posts** → See all published posts

- **Analytics** → View performance metrics

## 🔧 Requirements

## 🔧 What You Need

- Instagram Business Account

- Facebook Page (connected to Instagram)- Windows, Mac, or Linux computer

- Google Drive account- Internet connection

- Meta Developer account (free)- Instagram Business Account

- Google Cloud account (free)- Google Drive account

- Meta Developer Account (free to create)

---

## 📁 Project Structure

## 📁 Project Structure

```

```backend/     ← Server (handles Instagram, Google Drive)

backend/     ← Server (Instagram API, Database)frontend/    ← Website (what you see in browser)

frontend/    ← Website (Browser UI)```

```

---

---

**That's it! Ready to use.** 🎉

**👉 For complete instructions, read `START_HERE.md` 🎉**
