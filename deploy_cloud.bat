@echo off
setlocal
echo ----------------------------------------------------
echo [UWM CLOUD] STARTING AUTO-DEPLOY TO GITHUB... 
echo ----------------------------------------------------

:: Add all changes
git add .

:: Commit with dynamic message
set M="UWM Cloud Deploy: Updated Relay Server + Frontend @ %date% %time%"
git commit -m %M%

:: Push to main
echo [UWM] Pushing to GitHub (origin main)...
git push origin main

if %ERRORLEVEL% equ 0 (
    echo [UWM] SUCCESS: Cloud Deployment complete! 
) else (
    echo [UWM] ERROR: Push failed. Check your Git credentials or network.
)

echo ----------------------------------------------------
pause
