@echo off
chcp 65001 > nul
echo.
echo 🔍 בודק הגדרת המערכת...
echo ===============================
echo.

REM בדיקה אם זה Git repository
if not exist .git (
    echo ❌ התיקייה לא מוגדרת כ-Git repository
    echo הרץ: setup-git.bat
    goto :end
)
echo ✅ Git repository מוגדר

REM בדיקה אם יש remote
git remote -v > nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ לא מחובר לגיטהאב
    echo הרץ: setup-git.bat
    goto :end
)
echo ✅ מחובר לגיטהאב:
git remote -v

REM בדיקת זהות משתמש
echo.
git config user.name > nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ זהות משתמש לא מוגדרת
    echo הרץ: setup-git.bat
    goto :end
)
echo ✅ זהות משתמש מוגדרת:
echo שם: 
git config user.name
echo דואר: 
git config user.email

REM בדיקה אם יש שינויים
echo.
echo 📊 סטטוס נוכחי:
git status --porcelain > temp_status.txt
if not exist temp_status.txt (
    echo ✅ אין שינויים ממתינים
) else (
    for /f %%i in ('type temp_status.txt ^| find /c /v ""') do set count=%%i
    if !count! gtr 0 (
        echo ⚠️  יש !count! קבצים ששונו - מוכן לפרסום
    ) else (
        echo ✅ אין שינויים ממתינים
    )
    del temp_status.txt
)

REM בדיקת קבצי המערכת
echo.
echo 📁 בדיקת קבצי המערכת:
if exist admin.html (echo ✅ admin.html) else (echo ❌ admin.html חסר)
if exist publish.bat (echo ✅ publish.bat) else (echo ❌ publish.bat חסר)
if exist publish.js (echo ✅ publish.js) else (echo ❌ publish.js חסר)
if exist package.json (echo ✅ package.json) else (echo ❌ package.json חסר)

echo.
echo 🎉 המערכת מוכנה לעבודה!
echo.
echo 🚀 בדיקה מהירה - נסה להריץ:
echo   publish.bat
echo או:
echo   npm run update
echo.

:end
pause