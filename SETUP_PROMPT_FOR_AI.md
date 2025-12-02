# AI Assistant Setup Prompt for Instagram Autoposter

## Context
I need help setting up and deploying an Instagram Autoposter application that was recently migrated from Google Drive to local folder storage. The project is already working in development but needs to be set up with existing credentials and deployed.

## Project Repository
- **GitHub**: https://github.com/dalimoussa/instagram-app
- **Branch**: main (latest commit includes local storage migration)

## Technology Stack
- **Backend**: NestJS (Node.js), Prisma ORM, PostgreSQL 15, Redis 7, Bull queues
- **Frontend**: React 19, Vite, TanStack Query, Tailwind CSS
- **APIs**: Instagram Graph API v21.0, Cloudinary
- **Development**: Docker Compose (PostgreSQL + Redis)
- **Target Deployment**: VPS (Ubuntu/Debian) without Docker

## Existing Credentials (IMPORTANT - Use These Exactly)

### Instagram Graph API
```
INSTAGRAM_APP_ID=1130188699228533
INSTAGRAM_APP_SECRET=398709ab66548cd8b2a8dbde9d1128ac
INSTAGRAM_REDIRECT_URI=https://hydroelectric-cythia-confessingly.ngrok-free.dev/api/v1/ig-accounts/callback
INSTAGRAM_API_VERSION=v21.0
PUBLIC_URL=https://hydroelectric-cythia-confessingly.ngrok-free.dev
```

### Cloudinary (for media hosting)
```
CLOUDINARY_CLOUD_NAME=dkloxvwnl
CLOUDINARY_API_KEY=825568613916146
CLOUDINARY_API_SECRET=OSP_7kbfFc_U5h6SWYF-6bkLqig
```

### Database (Development)
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/instagram_autoposter?schema=public"
```
**Note**: Password is "kali" (not "postgres")

### JWT & Encryption
```
JWT_SECRET=e5cadf88d332820093e6d645cc9698517e3a420b1c9d250fcc44af9c8116fdc0
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=e5cadf88d332820093e6d645cc9698517e3a420b1c9d250fcc44af9c8116fdc0-refresh
JWT_REFRESH_EXPIRES_IN=7d
ENCRYPTION_KEY=MzvIDYFpH8h1f7kmaPIqcLADhQEsSOBuheI+4AVbeyY=
ENCRYPTION_ALGORITHM=aes-256-gcm
```

### CORS Origins
```
CORS_ORIGIN=http://localhost:5173,https://hydroelectric-cythia-confessingly.ngrok-free.dev
```

## What I Need Help With

### 1. Development Environment Setup
- Clone the repository from GitHub
- Install dependencies for both backend and frontend
- Set up PostgreSQL and Redis (using Docker Compose or native)
- Configure environment variables with the credentials above
- Run database migrations
- Start backend and frontend servers
- Verify the application works (login, connect Instagram account, create themes, schedule posts)

### 2. Key Features to Test
- **User Authentication**: Login/Register with JWT
- **Instagram OAuth**: Connect Instagram Business/Creator accounts using the ngrok URL
- **Theme Management**: Create themes with LOCAL folder paths (not Google Drive)
- **Media Sync**: Browse local folders, sync images/videos from local file system
- **Schedule Creation**: Create scheduled posts with captions, hashtags, multiple accounts
- **Post Execution**: Execute schedules to publish to Instagram (via Cloudinary for media hosting)
- **Dashboard**: View analytics and post history

### 3. Important Notes About Recent Changes
- **Google Drive has been completely removed** - the app now uses local folder paths
- Users browse and select folders on their local machine (e.g., `C:\Users\username\Pictures\instagram`)
- Media files are read directly from the file system using `LocalStorageService`
- The UI has a "Browse" button with a folder icon for easy folder selection
- When media is missing, users get a helpful alert to sync their theme folder


#
## Expected Deliverables

1. **Working Development Environment**
   - Backend running on http://localhost:3000/api/v1
   - Frontend running on http://localhost:5173
   - Database and Redis connected
   - All migrations applied

2. **Verification Steps Completed**
   - Successfully logged in to the application
   - Connected Instagram account visible in dashboard
   - Created a test theme with a local folder path
   - Synced media from local folder (at least 1-2 test images)
   - Created a test schedule
   - Executed schedule and verified post published to Instagram (or queued)

3. **Documentation**
   - List any issues encountered and how you resolved them
   - Confirm all existing credentials are working
   - Note any configuration changes made
   - Document the folder structure used for test media

## Common Issues to Watch For

1. **Database Password**: Make sure to use "kali" not "postgres"
2. **Prisma Client**: May need to regenerate after cloning: `npx prisma generate`
3. **ngrok URL**: The redirect URI uses ngrok - this is correct for development
4. **Local Folder Paths**: Use absolute paths (e.g., `C:\Users\...` on Windows, `/home/...` on Linux)
5. **Browser Security**: Folder picker may have limitations - users can also manually paste folder paths
6. **Media Formats**: Supported: .jpg, .jpeg, .png, .gif, .webp, .mp4, .mov, .avi, .mkv, .webm

## Additional Context

- The application was working perfectly before the Google Drive removal
- All OAuth flows are configured and tested
- Cloudinary integration is working for fast media uploads to Instagram
- The recent migration to local storage is complete and tested
- Focus on preserving all existing credentials and functionality

## Questions to Address

1. Are all services (backend, frontend, database, Redis) running correctly?
2. Can you log in and see the dashboard?
3. Is the Instagram account connection visible and active?
4. Can you create a theme with a local folder path and sync media?
5. Can you create and execute a schedule successfully?
6. Are there any errors in the browser console or backend logs?

---

**Please proceed step-by-step and confirm each milestone before moving to the next. Use the exact credentials provided above. Do not modify or generate new credentials unless absolutely necessary.**
