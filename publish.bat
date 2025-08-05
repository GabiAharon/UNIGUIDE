@echo off
echo.
echo 🚀 Publishing changes to GitHub...
echo =================================
echo.

REM Check if there are changes
git status --porcelain > temp_status.txt
for /f %%i in ('type temp_status.txt ^| find /c /v ""') do set count=%%i
del temp_status.txt
if %count% equ 0 (
    echo ℹ️  No changes to publish
    echo.
    pause
    exit /b 0
)

echo 📁 Adding files...
git add .
if %errorlevel% neq 0 (
    echo ❌ Error adding files
    pause
    exit /b 1
)

echo 💾 Creating commit...
git commit -m "Content update - %date% %time:~0,5%"
if %errorlevel% neq 0 (
    echo ❌ Error creating commit
    pause
    exit /b 1
)

echo 🌐 Pushing to GitHub...
git push
if %errorlevel% neq 0 (
    echo ❌ Error pushing to GitHub
    echo Check internet connection and authentication
    pause
    exit /b 1
)

echo.
echo 🎉 Successfully published to GitHub!
echo Website will update in a few minutes on Netlify
echo.
pause