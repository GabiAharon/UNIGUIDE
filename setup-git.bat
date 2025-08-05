@echo off
chcp 65001 > nul
echo.
echo 🔧 הגדרת Git ו-GitHub - פעם ראשונה בלבד
echo ================================================
echo.

REM בדיקה אם זה כבר repository של Git
if exist .git (
    echo ✅ התיקייה כבר מוגדרת כ-Git repository
    goto :check_remote
)

echo 📁 מאתחל Git repository...
git init
if %errorlevel% neq 0 (
    echo ❌ שגיאה באיתחול Git
    echo האם Git מותקן במחשב שלך? הורד מכאן: https://git-scm.com/download/win
    pause
    exit /b 1
)

:check_remote
echo.
echo 🌐 בדיקת חיבור לגיטהאב...
git remote -v > nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ❓ לא נמצא חיבור לגיטהאב
    echo.
    echo אנא הכנס את כתובת הרפוזיטורי שלך בגיטהאב:
    echo דוגמה: https://github.com/USERNAME/REPOSITORY-NAME.git
    echo.
    set /p repo_url="כתובת הרפוזיטורי: "
    
    echo.
    echo 🔗 מחבר לרפוזיטורי...
    git remote add origin %repo_url%
    if %errorlevel% neq 0 (
        echo ❌ שגיאה בחיבור לרפוזיטורי
        echo בדוק שהכתובת נכונה
        pause
        exit /b 1
    )
    echo ✅ חובר בהצלחה!
) else (
    echo ✅ כבר מחובר לגיטהאב
    git remote -v
)

echo.
echo 👤 בדיקת זהות משתמש...
git config user.name > nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ❓ לא הוגדרה זהות משתמש
    set /p user_name="הכנס את השם שלך: "
    set /p user_email="הכנס את הדואר האלקטרוני שלך: "
    
    git config --global user.name "%user_name%"
    git config --global user.email "%user_email%"
    echo ✅ זהות משתמש הוגדרה!
) else (
    echo ✅ זהות משתמש כבר מוגדרת
    echo שם: 
    git config user.name
    echo דואר: 
    git config user.email
)

echo.
echo 📋 מוסיף קבצים ראשוניים...
git add .
git commit -m "הגדרה ראשונית של מערכת ניהול התוכן"

echo.
echo 🚀 בודק חיבור ומנסה להעלות...
git push -u origin main
if %errorlevel% neq 0 (
    echo.
    echo ⚠️  העלאה נכשלה - אולי צריך להתחבר לגיטהאב
    echo.
    echo אפשרויות:
    echo 1. אם יש לך SSH key מוגדר - זה אמור לעבוד
    echo 2. אם לא, GitHub ידרוש ממך להתחבר
    echo 3. אולי הרפוזיטורי לא קיים - צור אותו בגיטהאב קודם
    echo.
    echo נסה שוב אחר כך עם: git push
    pause
) else (
    echo.
    echo 🎉 הכל מוגדר ומוכן לעבודה!
    echo מעכשיו תוכל להשתמש בסקריפטי הפרסום
    echo.
)

echo.
echo 📖 הבא: השתמש בקבצים הבאים לפרסום:
echo   - publish.bat (לחיצה כפולה)
echo   - npm run update (בטרמינל)
echo.
pause