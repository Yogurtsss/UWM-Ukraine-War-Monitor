@echo off
TITLE UWM Cloud Deployer
COLOR 0B

echo ----------------------------------------------------
echo [UWM CLOUD] PREPARING INDEPENDENT DEPLOYMENT...
echo ----------------------------------------------------

:: Ensure we are in the correct directory
cd /d "%~dp0"

:: Initialize fresh git if not exists
if not exist .git (
    echo [STATUS] Initializing new Git repository for Cloud...
    git init
    git remote add origin https://github.com/Yogurtsss/UWM-Ukraine-War-Monitor.git
    git branch -M main
)

echo [UWM] Stage and Commit...
git add .
set TIMESTAMP=%DATE% %TIME%
git commit -m "UWM Cloud Deploy: Full Frontend + Relay @ %TIMESTAMP%"

echo [UWM] Pushing to GitHub (origin main)...
git push -f origin main

if %ERRORLEVEL% neq 0 (
    echo [UWM] ERROR: Push failed. Check your Git credentials or GitHub Secret Protection.
) else (
    echo [UWM] SUCCESS: Cloud Deployment complete!
)

echo ----------------------------------------------------
pause
