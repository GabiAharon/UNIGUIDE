@echo off
echo.
echo 🚀 Publishing with custom message...
echo ===================================
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

echo ❓ Enter commit message:
set /p commit_message="Message: "
if "%commit_message%"=="" (
    echo ⚠️  Message cannot be empty
    pause
    exit /b 1
)

echo 📁 Adding files...
git add .
if %errorlevel% neq 0 (
    echo ❌ Error adding files
    pause
    exit /b 1
)

echo 💾 Creating commit with your message...
git commit -m "%commit_message%"
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
echo 🎉 Successfully published with message: "%commit_message%"
echo Website will update in a few minutes on Netlify
echo.
pause