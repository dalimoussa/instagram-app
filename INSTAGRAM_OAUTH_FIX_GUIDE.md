# Instagram OAuth Issue Fix Guide

## Problem
User signs up successfully and connects Instagram account. Backend logs show successful OAuth and account retrieval, but the account doesn't appear in the frontend UI.

## Root Cause Analysis

### What We Know:
1. ✅ Backend OAuth flow completes successfully
2. ✅ Instagram account data is fetched (logs show: "Found Instagram Business Account: 17841478409840050")
3. ❌ Account doesn't appear in frontend UI
4. ⚠️  Backend logs show the same OAuth flow executing 5+ times (abnormal)

### Possible Causes:
1. **Database Save Failure**: Account data not persisting to database
2. **User ID Mismatch**: OAuth callback using different userId than signup
3. **Frontend Query Issue**: TanStack Query not refetching after OAuth
4. **Popup Closure Detection**: Popup not closing properly, causing retries

## Fixes Applied

### 1. Enhanced Backend Logging
**File**: `backend/src/ig-accounts/ig-accounts.service.ts`

Added detailed logging to track:
- ✅ When accounts are saved: `💾 Instagram account saved to database`
- ✅ When accounts are queried: `🔍 Finding all Instagram accounts for user`
- ✅ Account details: userId, igUserId, username

**File**: `backend/src/ig-accounts/ig-accounts.controller.ts`

Added logging in callback:
- ✅ Account creation confirmation with details

### 2. Improved Frontend Communication
**File**: `frontend/src/pages/Accounts.tsx`

Implemented `postMessage` for immediate updates:
```typescript
// OAuth callback now sends postMessage to parent window
window.opener.postMessage({ 
  type: 'INSTAGRAM_CONNECTED',
  account: { id, username, igUserId }
}, 'http://localhost:5173');
```

Frontend listens for this message:
```typescript
const handleMessage = (event: MessageEvent) => {
  if (event.data.type === 'INSTAGRAM_CONNECTED') {
    queryClient.invalidateQueries({ queryKey: ['ig-accounts'] });
    addNotification('success', `Account connected!`);
  }
};
window.addEventListener('message', handleMessage);
```

### 3. Better OAuth Callback Response
**File**: `backend/src/ig-accounts/ig-accounts.controller.ts`

Enhanced callback HTML:
- ✅ Shows account username immediately
- ✅ Uses `postMessage` to notify parent window
- ✅ Auto-closes after 1.5 seconds (faster response)
- ✅ Better visual feedback

## Verification Steps

### Step 1: Check Database (Prisma Studio)
```powershell
cd backend
npx prisma studio
```

1. Open http://localhost:5555
2. Go to **IgAccount** table
3. Look for account with `igUserId = "17841478409840050"`
4. If it exists:
   - ✅ Note the `userId` field
   - ✅ Check `isActive = true`
   - ✅ Verify `username` is correct
5. Go to **User** table
6. Find your user account
7. Compare `user.id` with `igAccount.userId` - **MUST MATCH**

### Step 2: Test API Directly
```powershell
.\test-ig-accounts.ps1
```

This script will:
1. Ask for your JWT token
2. Call `GET /ig-accounts` endpoint
3. Show all accounts for your user
4. Display detailed account information

**How to get JWT token:**
1. Login to the app at http://localhost:5173
2. Open browser DevTools (F12)
3. Go to Console
4. Type: `localStorage.getItem('token')`
5. Copy the token (without quotes)

### Step 3: Check Backend Logs

After connecting Instagram, you should see:
```
🔍 Fetching Facebook Pages...
📄 Facebook Pages found: 1
✅ Found Instagram Business Account: 17841478409840050
💾 Instagram account saved to database: { accountId, username, igUserId, userId }
✅ Account created/updated successfully: { id, username, userId }
```

Then when frontend refreshes:
```
🔍 Finding all Instagram accounts for user: <userId>
📊 Found 1 active Instagram account(s): [{ id, username, igUserId }]
```

If you see the save log but NOT the query log, the frontend isn't calling the API.

### Step 4: Check Frontend Console

Open browser DevTools → Console. You should see:
```
✅ Instagram account connected via postMessage: { account details }
```

If you see this, the communication is working.

### Step 5: Test Complete Flow

1. **Start fresh** (clear browser cache and localStorage):
   ```javascript
   // In browser console:
   localStorage.clear();
   ```

2. **Login** to the app

3. **Go to Accounts page**

4. **Click "Connect Instagram"**

5. **Watch for**:
   - Popup opens with Instagram OAuth
   - Popup redirects to Facebook login
   - After approval, popup shows success message
   - Popup closes after 1.5 seconds
   - **Main window should show notification** ✅
   - **Accounts list should update immediately** ✅

6. **If still not working**, check:
   - Browser console for errors
   - Backend logs for database errors
   - Prisma Studio for account existence
   - User ID matches between User and IgAccount tables

## Common Issues and Solutions

### Issue 1: Repeated OAuth Attempts (5+ times)
**Symptoms**: Backend logs show same Instagram account fetched multiple times

**Causes**:
- Popup not closing properly
- Frontend creating multiple OAuth flows
- `connectingRef` not preventing duplicate calls

**Fix**: Already applied - added `postMessage` and cleanup

### Issue 2: Account Saved but Not Showing
**Symptoms**: Database has account, but frontend shows empty

**Causes**:
- User ID mismatch
- TanStack Query cache issue
- Frontend API not including auth token

**Solution**:
```powershell
# Test API directly
.\test-ig-accounts.ps1
```

If API returns accounts, it's a frontend issue. Check:
- `localStorage.getItem('token')` exists
- API client includes Authorization header
- No CORS errors in console

### Issue 3: Database Save Fails
**Symptoms**: Backend logs show OAuth success but no "💾 Instagram account saved"

**Causes**:
- Database constraint violation
- Encryption service error
- Prisma schema mismatch

**Solution**:
1. Check backend logs for detailed error
2. Verify Prisma schema is up to date:
   ```powershell
   cd backend
   npx prisma generate
   npx prisma migrate deploy
   ```

### Issue 4: User ID Mismatch
**Symptoms**: Account saved with different userId than logged-in user

**Causes**:
- OAuth state not storing correct userId
- Multiple users in database
- Token doesn't match signup user

**Solution**:
1. Check Prisma Studio - compare User.id with IgAccount.userId
2. If mismatch, delete incorrect account:
   ```sql
   DELETE FROM "IgAccount" WHERE "userId" != '<correct-user-id>';
   ```
3. Reconnect Instagram

## Next Steps

1. ✅ **Restart backend** to apply new logging:
   ```powershell
   cd backend
   npm run start:dev
   ```

2. ✅ **Restart frontend** to apply postMessage listener:
   ```powershell
   cd frontend
   npm run dev
   ```

3. ✅ **Open Prisma Studio** in a separate terminal:
   ```powershell
   cd backend
   npx prisma studio
   ```

4. ✅ **Test OAuth flow** again and watch:
   - Backend terminal for detailed logs
   - Frontend terminal for any errors
   - Browser console for postMessage events
   - Prisma Studio for database changes

5. ✅ **If still not working**, run diagnostic:
   ```powershell
   .\test-ig-accounts.ps1
   ```

## Success Criteria

You'll know it's fixed when:
- ✅ OAuth popup closes automatically after 1.5 seconds
- ✅ Main window shows "Account @username connected!" notification
- ✅ Accounts list updates immediately (no page refresh needed)
- ✅ Backend logs show: "💾 Instagram account saved" and "📊 Found 1 active Instagram account"
- ✅ Prisma Studio shows account with correct userId
- ✅ No repeated OAuth attempts (should only happen once per connection)

## Demo User Creation (Bonus)

Since you wanted demo credentials originally, here's how to create a seed file:

```powershell
# Create seed file
New-Item -Path "backend/prisma/seed.ts" -ItemType File -Force
```

Add this content to `backend/prisma/seed.ts`:
```typescript
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create demo user
  const hashedPassword = await bcrypt.hash('demo1234', 10);
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@instagram-scheduler.com' },
    update: {},
    create: {
      email: 'demo@instagram-scheduler.com',
      password: hashedPassword,
      name: 'Demo User',
    },
  });

  console.log('✅ Demo user created:', {
    email: 'demo@instagram-scheduler.com',
    password: 'demo1234',
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Then run:
```powershell
cd backend
npx tsx prisma/seed.ts
```

**Demo credentials**:
- Email: `demo@instagram-scheduler.com`
- Password: `demo1234`
