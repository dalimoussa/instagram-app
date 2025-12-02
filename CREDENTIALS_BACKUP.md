# Client Credentials Backup
**Date:** December 2, 2025

## Backend .env
```
INSTAGRAM_REDIRECT_URI=https://hydroelectric-cythia-confessingly.ngrok-free.dev/api/v1/ig-accounts/callback
PUBLIC_URL=https://hydroelectric-cythia-confessingly.ngrok-free.dev
CORS_ORIGIN=http://localhost:5173,https://hydroelectric-cythia-confessingly.ngrok-free.dev
```

## Frontend .env
```
VITE_API_URL=https://hydroelectric-cythia-confessingly.ngrok-free.dev/api/v1
```

## Notes
- Client is using ngrok URL: `https://hydroelectric-cythia-confessingly.ngrok-free.dev`
- These credentials will be restored after removing Google Drive and Docker dependencies
- VPS deployment will use local PostgreSQL and Redis (no Docker)
