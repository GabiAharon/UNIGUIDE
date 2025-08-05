@echo off
chcp 65001 >nul
title UNIGuide - React Editor

echo.
echo ================================================
echo    🚀 UNIGuide React Editor
echo ================================================
echo.
echo Starting React + Vite Development Server...
echo.
echo The editor will be available at:
echo 📍 http://localhost:3001
echo.
echo ✨ Features:
echo   - React + TypeScript + Tailwind CSS
echo   - Real-time preview
echo   - Modern UI/UX
echo   - GitHub integration
echo   - Keyboard shortcuts (Ctrl+S, Ctrl+Enter)
echo.
echo Press Ctrl+C to stop the server
echo.

cd react-editor
npm run dev