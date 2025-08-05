@echo off
chcp 65001 > nul
echo.
echo 🚀 מפרסם שינויים לגיטהאב עם הודעה מותאמת אישית...
echo.

REM בקשת הודעת commit מהמשתמש
set /p commit_message="הכנס הודעת commit (או לחץ Enter להודעה אוטומטית): "

REM אם לא הוכנסה הודעה, השתמש בהודעה אוטומטית
if "%commit_message%"=="" (
    for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
    set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
    set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
    set "datestamp=%DD%/%MM%/%YYYY% %HH%:%Min%"
    set "commit_message=עדכון תוכן - %datestamp%"
)

echo.
echo 📁 מוסיף קבצים...
git add .
if %errorlevel% neq 0 (
    echo ❌ שגיאה בהוספת קבצים
    pause
    exit /b 1
)

echo 💾 יוצר commit עם ההודעה: "%commit_message%"
git commit -m "%commit_message%"
if %errorlevel% neq 0 (
    echo ❌ שגיאה ביצירת commit
    pause
    exit /b 1
)

echo ☁️ דוחף לגיטהאב...
git push
if %errorlevel% neq 0 (
    echo ❌ שגיאה בדחיפה לגיטהאב
    pause
    exit /b 1
)

echo.
echo ✅ הושלם בהצלחה! 🎉
echo האתר יתעדכן בעוד כמה דקות ב-Netlify
echo.
pause