@echo off
setlocal
echo ----------------------------------------------------
echo [UWM] STARTING AUTO-DEPLOY TO GITHUB... 
echo ----------------------------------------------------

:: Ensure we are in the right branch
git checkout main

:: Add all changes
git add .

:: Commit with dynamic message
set M="UWM Deploy: Updated Multilingual Dashboard + OSINT Pipeline @ %date% %time%"
git commit -m %M%

:: Push to main
echo [UWM] Pushing to GitHub (origin main)...
git push origin main

if %ERRORLEVEL% equ 0 (
    echo [UWM] SUCCESS: Deployment complete! 
) else (
    echo [UWM] ERROR: Push failed. Check your Git credentials or network.
)

echo ----------------------------------------------------
pause
