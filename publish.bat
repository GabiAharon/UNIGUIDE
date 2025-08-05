@echo off
chcp 65001 > nul
echo.
echo 🚀 מפרסם שינויים לגיטהאב...
echo.

REM בדיקה אם יש שינויים
git status --porcelain > nul
if %errorlevel% neq 0 (
    echo ❌ שגיאה בבדיקת סטטוס גיט
    pause
    exit /b 1
)

REM הוספת כל הקבצים
echo 📁 מוסיף קבצים...
git add .
if %errorlevel% neq 0 (
    echo ❌ שגיאה בהוספת קבצים
    pause
    exit /b 1
)

REM יצירת commit עם timestamp אוטומטי
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "datestamp=%DD%/%MM%/%YYYY% %HH%:%Min%"

echo 💾 יוצר commit...
git commit -m "עדכון תוכן - %datestamp%"
if %errorlevel% neq 0 (
    echo ❌ שגיאה ביצירת commit
    pause
    exit /b 1
)

REM דחיפה לגיטהאב
echo ☁️ דוחף לגיטהאב...
git push
if %errorlevel% neq 0 (
    echo ❌ שגיאה בדחיפה לגיטהאב
    echo אולי צריך להגדיר את הגיטהאב או להתחבר?
    pause
    exit /b 1
)

echo.
echo ✅ הושלם בהצלחה! 🎉
echo האתר יתעדכן בעוד כמה דקות ב-Netlify
echo.
pause