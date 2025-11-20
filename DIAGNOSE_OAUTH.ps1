# Quick Database Diagnostic for Instagram OAuth Issue
Write-Host "🔍 Instagram OAuth Database Diagnostic" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Prisma Studio is accessible
Write-Host "📊 Checking Prisma Studio..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5555" -UseBasicParsing -TimeoutSec 3
    Write-Host "  ✅ Prisma Studio is running on http://localhost:5555" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Prisma Studio is not running" -ForegroundColor Red
    Write-Host "  💡 Start it with: cd backend; npx prisma studio" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🗄️  Database Information Needed:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Please open Prisma Studio (http://localhost:5555) and check:" -ForegroundColor White
Write-Host ""
Write-Host "1️⃣  IgAccount Table:" -ForegroundColor Cyan
Write-Host "   • Does an account with igUserId = '17841478409840050' exist?" -ForegroundColor Gray
Write-Host "   • If YES, note the following fields:" -ForegroundColor Gray
Write-Host "     - id: _______________" -ForegroundColor Gray
Write-Host "     - userId: _______________" -ForegroundColor Gray
Write-Host "     - username: _______________" -ForegroundColor Gray
Write-Host "     - isActive: _______________" -ForegroundColor Gray
Write-Host "     - createdAt: _______________" -ForegroundColor Gray
Write-Host ""
Write-Host "2️⃣  User Table:" -ForegroundColor Cyan
Write-Host "   • Find your user account (the one you signed up with)" -ForegroundColor Gray
Write-Host "   • Note the id field: _______________" -ForegroundColor Gray
Write-Host ""
Write-Host "3️⃣  Compare:" -ForegroundColor Cyan
Write-Host "   • Does IgAccount.userId MATCH User.id?" -ForegroundColor Gray
Write-Host "     ☐ YES - This is good! The account is linked correctly." -ForegroundColor Green
Write-Host "     ☐ NO  - This is the problem! userId mismatch." -ForegroundColor Red
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

Write-Host "🔬 Backend Logs to Check:" -ForegroundColor Yellow
Write-Host ""
Write-Host "In your backend terminal, look for these recent logs:" -ForegroundColor White
Write-Host ""
Write-Host "Expected after OAuth:" -ForegroundColor Cyan
Write-Host "  ✅ Found Instagram Business Account: 17841478409840050" -ForegroundColor Gray
Write-Host "  💾 Instagram account saved to database: { ... }" -ForegroundColor Gray
Write-Host "  ✅ Account created/updated successfully: { ... }" -ForegroundColor Gray
Write-Host ""
Write-Host "Expected when frontend loads accounts:" -ForegroundColor Cyan
Write-Host "  🔍 Finding all Instagram accounts for user: <userId>" -ForegroundColor Gray
Write-Host "  📊 Found X active Instagram account(s): [...]" -ForegroundColor Gray
Write-Host ""

Write-Host "If you see 'Found 0 active Instagram accounts', there are 3 possible reasons:" -ForegroundColor Yellow
Write-Host "  1. Account doesn't exist in database (not saved)" -ForegroundColor Gray
Write-Host "  2. Account.userId doesn't match logged-in User.id" -ForegroundColor Gray
Write-Host "  3. Account.isActive = false" -ForegroundColor Gray
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

Write-Host "🌐 Frontend Diagnostic:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Open browser console (F12) and run these commands:" -ForegroundColor White
Write-Host ""
Write-Host "1. Check if you're logged in:" -ForegroundColor Cyan
Write-Host "   localStorage.getItem('token')" -ForegroundColor Gray
Write-Host "   • Should return a JWT token string" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Decode the token to see userId:" -ForegroundColor Cyan
Write-Host "   JSON.parse(atob(localStorage.getItem('token').split('.')[1]))" -ForegroundColor Gray
Write-Host "   • Look for the 'sub' or 'userId' field" -ForegroundColor Gray
Write-Host "   • This should match IgAccount.userId in database" -ForegroundColor Gray
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

Write-Host "🔧 Quick Fixes:" -ForegroundColor Yellow
Write-Host ""

Write-Host "If account exists but userId doesn't match:" -ForegroundColor Cyan
Write-Host "  1. Open Prisma Studio" -ForegroundColor Gray
Write-Host "  2. Go to IgAccount table" -ForegroundColor Gray
Write-Host "  3. Find the account with igUserId = '17841478409840050'" -ForegroundColor Gray
Write-Host "  4. Click Edit on that row" -ForegroundColor Gray
Write-Host "  5. Update userId field to match your User.id" -ForegroundColor Gray
Write-Host "  6. Save changes" -ForegroundColor Gray
Write-Host "  7. Refresh the frontend" -ForegroundColor Gray
Write-Host ""

Write-Host "If account doesn't exist at all:" -ForegroundColor Cyan
Write-Host "  1. Check backend logs for errors during OAuth" -ForegroundColor Gray
Write-Host "  2. Try connecting Instagram again" -ForegroundColor Gray
Write-Host "  3. Watch backend logs for '💾 Instagram account saved'" -ForegroundColor Gray
Write-Host ""

Write-Host "If multiple users exist:" -ForegroundColor Cyan
Write-Host "  1. Make sure you're logged in with the SAME user that connected Instagram" -ForegroundColor Gray
Write-Host "  2. Check User table in Prisma Studio - you should only have 1 user" -ForegroundColor Gray
Write-Host "  3. If multiple users, delete the wrong ones or use the correct login" -ForegroundColor Gray
Write-Host ""

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

Write-Host "📞 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Check Prisma Studio as described above" -ForegroundColor White
Write-Host "  2. Share your findings:" -ForegroundColor White
Write-Host "     • Does IgAccount exist? (YES/NO)" -ForegroundColor Gray
Write-Host "     • If YES, what is the userId?" -ForegroundColor Gray
Write-Host "     • What is your User.id?" -ForegroundColor Gray
Write-Host "     • Do they match?" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. If you need to test the API directly:" -ForegroundColor White
Write-Host "     • Run: .\test-ig-accounts.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "  4. For complete troubleshooting guide:" -ForegroundColor White
Write-Host "     • Read: INSTAGRAM_OAUTH_FIX_GUIDE.md" -ForegroundColor Gray
Write-Host ""

Write-Host "✅ Diagnostic complete!" -ForegroundColor Green
