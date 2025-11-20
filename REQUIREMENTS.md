# 📦 System Requirements

## Required Software

### 1. Node.js
- **Version**: 20.x LTS or newer
- **Download**: https://nodejs.org
- **Purpose**: Runs the backend and frontend

### 2. PostgreSQL
- **Version**: 15.x or newer
- **Download**: https://www.postgresql.org/download/
- **Purpose**: Database for storing accounts, posts, schedules

### 3. Redis
- **Version**: 7.x or newer
- **Download**: 
  - Windows: https://github.com/tporadowski/redis/releases
  - Mac: `brew install redis`
  - Linux: `sudo apt-get install redis-server`
- **Purpose**: Queue system for background jobs

### 4. Ngrok
- **Version**: Latest
- **Download**: https://ngrok.com/download
- **Purpose**: Creates public URL for Instagram OAuth callbacks
- **Note**: Free account required

---

## npm Packages (Auto-installed)

When you run `npm install`, these are automatically installed:

### Backend Dependencies:
```
@nestjs/common@^10.0.0
@nestjs/core@^10.0.0
@nestjs/platform-express@^10.0.0
@prisma/client@^5.0.0
bull@^4.11.0
redis@^4.6.0
bcrypt@^5.1.0
jsonwebtoken@^9.0.0
axios@^1.6.0
sharp@^0.33.0
dotenv@^16.3.0
```

### Frontend Dependencies:
```
react@^19.0.0
react-dom@^19.0.0
react-router-dom@^6.20.0
@tanstack/react-query@^5.0.0
zustand@^4.4.0
recharts@^2.10.0
lucide-react@^0.300.0
tailwindcss@^3.4.0
axios@^1.6.0
```

---

## External Services (Free Accounts)

### 1. Meta Developer Account
- **Website**: https://developers.facebook.com
- **Purpose**: Instagram Graph API access
- **Cost**: Free
- **Setup**: See `META_SETUP.md`

### 2. Google Cloud Platform
- **Website**: https://console.cloud.google.com
- **Purpose**: Google Drive API & Google Sheets API
- **Cost**: Free tier (enough for this app)
- **Setup**: See `META_SETUP.md`

### 3. Cloudinary (Optional)
- **Website**: https://cloudinary.com
- **Purpose**: Image/video hosting
- **Cost**: Free tier (25 GB storage)
- **Alternative**: Can use local storage or AWS S3

---

## Minimum System Requirements

- **OS**: Windows 10+, macOS 11+, or Linux (Ubuntu 20.04+)
- **RAM**: 4 GB minimum (8 GB recommended)
- **Disk Space**: 2 GB free space
- **CPU**: Any modern processor
- **Internet**: Stable broadband connection

---

## Port Requirements

Make sure these ports are available:

- **3000**: Backend API server
- **5173**: Frontend development server
- **5432**: PostgreSQL database
- **6379**: Redis server

---

## Installation Order

1. ✅ Install Node.js
2. ✅ Install PostgreSQL
3. ✅ Install Redis
4. ✅ Install Ngrok
5. ✅ Create Meta Developer account
6. ✅ Create Google Cloud account
7. ✅ Run `npm install` in backend folder
8. ✅ Run `npm install` in frontend folder
9. ✅ Setup database (see `INSTALLATION.md`)
10. ✅ Configure .env files (see `INSTALLATION.md`)

---

**See `INSTALLATION.md` for detailed installation instructions.**
