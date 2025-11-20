<#
Helper PowerShell script to initialize, commit and push this repo to GitHub.
It will NOT push secrets automatically. You will be prompted whether to include .env files.

Run from project root in PowerShell (Windows):
    .\push-to-github.ps1
#>

param(
    [string]$remoteUrl = 'https://github.com/dalimoussa/instagram-app.git',
    [string]$branch = 'main'
)

Write-Host "This script will initialize a local git repository (if none), commit files and push to: $remoteUrl" -ForegroundColor Cyan

# Confirm user understands risk of committing .env
$includeEnv = Read-Host "Do you want to include .env files in the commit? (yes/no)"
if ($includeEnv -ne 'yes' -and $includeEnv -ne 'no') {
    Write-Host "Please answer 'yes' or 'no'" -ForegroundColor Yellow
    exit 1
}

# Initialize git if needed
if (-not (Test-Path .git)) {
    git init
    Write-Host "Initialized git repository" -ForegroundColor Green
}

# Ensure branch name
git branch -M $branch 2>$null | Out-Null

# If includeEnv=yes, optionally force-add any .env files
if ($includeEnv -eq 'yes') {
    Write-Host "You chose to include .env files. THIS IS INSECURE. Make sure you really want to proceed." -ForegroundColor Red
    $confirm = Read-Host "Type CONFIRM to continue"
    if ($confirm -ne 'CONFIRM') {
        Write-Host "Not confirmed. Aborting." -ForegroundColor Yellow
        exit 1
    }

    # Force add any .env files
    $envFiles = Get-ChildItem -Path . -Filter '*.env*' -Recurse -File
    foreach ($f in $envFiles) {
        Write-Host "Force adding $($f.FullName)" -ForegroundColor Yellow
        git add -f "$($f.FullName)"
    }
}

# Add all other files (respect .gitignore)
git add -A

# Commit
$commitMsg = Read-Host "Enter commit message (default: 'Initial commit from local machine')"
if (-not $commitMsg) { $commitMsg = 'Initial commit from local machine' }

git commit -m "$commitMsg"

# Add remote if not present
$existing = git remote -v 2>$null
if (-not $existing) {
    git remote add origin $remoteUrl
    Write-Host "Remote origin set to $remoteUrl" -ForegroundColor Green
}

Write-Host "Pushing to remote origin/$branch..." -ForegroundColor Cyan
Write-Host "You may be prompted for credentials or a token. Use a GitHub Personal Access Token (PAT) if prompted for a password." -ForegroundColor Yellow

git push -u origin $branch

Write-Host "Done. If git push failed due to authentication, create a PAT in GitHub and try again or configure SSH." -ForegroundColor Green
