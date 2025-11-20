# 📦 Installation Guide

Simple step-by-step guide to install everything you need.

## Step 1: Install Node.js

1. Go to: https://nodejs.org
2. Download **LTS version** (20.x or newer)
3. Run installer and click "Next" until done
4. Open terminal and check:
   ```bash
   node --version
   # Should show: v20.x.x or newer
   ```

## Step 2: Install PostgreSQL (Database)

1. Go to: https://www.postgresql.org/download/
2. Download version 15 or newer
3. During installation:
   - Set password: `postgres123` (remember this!)
   - Port: `5432` (default)
   - Click "Next" until done
4. Open terminal and check:
   ```bash
   psql --version
   # Should show: psql (PostgreSQL) 15.x
   ```

## Step 3: Install Redis

### Windows:
1. Download: https://github.com/tporadowski/redis/releases
2. Download `Redis-x64-5.x.x.msi`
3. Run installer, click "Next" until done
4. Redis will start automatically

### Mac:
```bash
brew install redis
brew services start redis
```

### Linux:
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis
```

Check Redis is running:
```bash
redis-cli ping
# Should show: PONG
```

## Step 4: Install Ngrok (for Instagram OAuth)

1. Go to: https://ngrok.com
2. Sign up (free account)
3. Download ngrok for your OS
4. Move to a permanent folder
5. Login with your token:
   ```bash
   ngrok config add-authtoken YOUR_TOKEN_HERE
   ```

## Step 5: Install Project Dependencies

```bash
# Go to project folder
cd "c:\Users\medal\Downloads\New folder JP"

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

## Step 6: Setup Database

```bash
# Go to backend folder
cd backend

# Create database
# Open psql:
psql -U postgres

# In psql, run:
CREATE DATABASE instagram_autoposter;
\q

# Run migrations
npx prisma migrate deploy

# (Optional) Add sample data
npx prisma db seed
```

## Step 7: Create Environment Files

### Backend (.env file):

Create file: `backend/.env`

```env
# Database
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/instagram_autoposter"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379

# JWT Secret (change this to any random string)
JWT_SECRET="change_this_to_random_string_min_32_chars_long"
JWT_EXPIRES_IN="3600"

# Meta/Instagram (get from META_SETUP.md)
META_APP_ID="your_app_id_here"
META_APP_SECRET="your_app_secret_here"
META_REDIRECT_URI="http://localhost:3000/api/v1/auth/instagram/callback"

# Google (get from META_SETUP.md)
GOOGLE_CLIENT_ID="your_google_client_id_here"
GOOGLE_CLIENT_SECRET="your_google_client_secret_here"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/v1/auth/google/callback"

# Cloudinary (for image hosting - optional, create free account)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# App
PORT=3000
NODE_ENV=development
```

### Frontend (.env file):

Create file: `frontend/.env`

```env
VITE_API_URL=http://localhost:3000/api/v1
```

## Step 8: Start Ngrok (for Instagram OAuth)

```bash
# In a new terminal, run:
ngrok http 3000

# Copy the HTTPS URL (like: https://abc123.ngrok.io)
# Update backend/.env:
META_REDIRECT_URI="https://abc123.ngrok.io/api/v1/auth/instagram/callback"
GOOGLE_REDIRECT_URI="https://abc123.ngrok.io/api/v1/auth/google/callback"
```

## ✅ Installation Complete!

You're ready to start the application. See `README.md` for next steps.

### Quick Check:
- ✅ Node.js installed
- ✅ PostgreSQL installed and running
- ✅ Redis installed and running
- ✅ Ngrok installed and running
- ✅ Dependencies installed (npm install)
- ✅ Database created and migrated
- ✅ .env files created

### Troubleshooting:

**Problem: npm install fails**
- Solution: Delete `node_modules` and `package-lock.json`, run `npm install` again

**Problem: Database connection error**
- Solution: Check PostgreSQL is running, check password in .env matches

**Problem: Redis connection error**
- Solution: Check Redis is running: `redis-cli ping` should return PONG

**Problem: Port already in use**
- Solution: Change PORT in backend/.env to 3001 or another number

---

**Need help?** Check that all services are running:
- PostgreSQL: Check in Services (Windows) or Activity Monitor (Mac)
- Redis: Run `redis-cli ping`
- Ngrok: Check terminal shows "Forwarding" message
