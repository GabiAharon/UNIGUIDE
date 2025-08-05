/**
 * תסריט לעדכון הקבצים הקיימים עם התוכן החדש
 * מחבר את מערכת ניהול התוכן לקבצים הקיימים
 */

const fs = require('fs').promises;
const path = require('path');

class FileUpdater {
    constructor() {
        this.backupDir = path.join(process.cwd(), 'backups');
    }

    async updateFiles() {
        console.log('🔄 מעדכן קבצים קיימים עם התוכן החדש...\n');

        try {
            // יצירת גיבוי של הקבצים הקיימים
            await this.createBackup();

            // עדכון index.html
            await this.updateIndexHTML();

            // עדכון quiz.html
            await this.updateQuizHTML();

            // הוספת לינק לממשק הניהול
            await this.addAdminLink();

            console.log('\n✅ עדכון הקבצים הושלם בהצלחה!');
            console.log('\n📝 מה עודכן:');
            console.log('  - נוסף תמיכה במערכת ניהול התוכן');
            console.log('  - נוסף קישור לממשק הניהול');
            console.log('  - נוצרו גיבויים של הקבצים המקוריים');
            console.log('  - הוכנו הקבצים לעדכון דינמי');

        } catch (error) {
            console.error('❌ שגיאה בעדכון הקבצים:', error.message);
        }
    }

    // יצירת גיבוי
    async createBackup() {
        console.log('💾 יוצר גיבוי של הקבצים הקיימים...');
        
        await fs.mkdir(this.backupDir, { recursive: true });
        
        const filesToBackup = ['index.html', 'quiz.html'];
        const timestamp = new Date().toISOString().split('T')[0];

        for (const file of filesToBackup) {
            try {
                const content = await fs.readFile(file, 'utf8');
                const backupName = `${timestamp}-${file}`;
                await fs.writeFile(path.join(this.backupDir, backupName), content, 'utf8');
                console.log(`  ✓ גיבוי נוצר: ${backupName}`);
            } catch (error) {
                console.log(`  ! קובץ ${file} לא נמצא`);
            }
        }
    }

    // עדכון index.html
    async updateIndexHTML() {
        console.log('📄 מעדכן index.html...');

        try {
            let content = await fs.readFile('index.html', 'utf8');

            // הוספת מטא-תגים לניהול תוכן
            const metaTags = `
    <meta name="content-management" content="enabled">
    <meta name="last-updated" content="${new Date().toISOString()}">`;

            if (!content.includes('content-management')) {
                content = content.replace('<meta name="viewport"', metaTags + '\n    <meta name="viewport"');
            }

            // הוספת סקריפטים לניהול תוכן
            const scripts = `
    <script src="content-manager.js"></script>
    <script src="mcp-integration.js"></script>
    <script>
        // אתחול מערכת ניהול התוכן
        document.addEventListener('DOMContentLoaded', function() {
            if (window.contentManager) {
                console.log('✅ מערכת ניהול התוכן הופעלה');
            }
        });
    </script>`;

            if (!content.includes('content-manager.js')) {
                content = content.replace('</body>', scripts + '\n</body>');
            }

            // הוספת כפתור לממשק הניהול
            const adminButton = `
        <div style="position: fixed; top: 20px; left: 20px; z-index: 9999;">
            <a href="admin.html" style="
                background: linear-gradient(45deg, #FF6B6B, #4ECDC4);
                color: white;
                padding: 10px 15px;
                border-radius: 25px;
                text-decoration: none;
                font-weight: bold;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                transition: all 0.3s ease;
                display: inline-block;
            " onmouseover="this.style.transform='translateY(-2px)'"
               onmouseout="this.style.transform='translateY(0)'">
                🛠️ ניהול תוכן
            </a>
        </div>`;

            if (!content.includes('ניהול תוכן')) {
                content = content.replace('<body>', '<body>' + adminButton);
            }

            await fs.writeFile('index.html', content, 'utf8');
            console.log('  ✓ index.html עודכן בהצלחה');

        } catch (error) {
            console.log('  ! שגיאה בעדכון index.html:', error.message);
        }
    }

    // עדכון quiz.html
    async updateQuizHTML() {
        console.log('📄 מעדכן quiz.html...');

        try {
            let content = await fs.readFile('quiz.html', 'utf8');

            // הוספת מטא-תגים
            const metaTags = `
    <meta name="quiz-management" content="enabled">
    <meta name="last-updated" content="${new Date().toISOString()}">`;

            if (!content.includes('quiz-management')) {
                content = content.replace('<meta name="viewport"', metaTags + '\n    <meta name="viewport"');
            }

            // הוספת הודעה על עדכון אוטומטי
            const updateNotice = `
        <div id="quiz-update-notice" style="
            background: #e8f4fd;
            border: 1px solid #b8daff;
            border-radius: 8px;
            padding: 12px;
            margin: 20px 0;
            text-align: center;
            font-size: 0.9em;
            color: #004085;
        ">
            💡 השאלות בבחינה זו מתעדכנות אוטומטית על בסיס התוכן במערכת הניהול
        </div>`;

            if (!content.includes('quiz-update-notice')) {
                content = content.replace('<div class="container">', '<div class="container">' + updateNotice);
            }

            // הוספת כפתור חזרה למדריך משופר
            const backButton = `
        <div style="text-align: center; margin: 20px 0;">
            <a href="index.html" style="
                background: linear-gradient(45deg, #667eea, #764ba2);
                color: white;
                padding: 12px 25px;
                border-radius: 25px;
                text-decoration: none;
                font-weight: bold;
                display: inline-block;
                transition: all 0.3s ease;
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(0,0,0,0.2)'"
               onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                ← חזרה למדריך
            </a>
            <a href="admin.html" style="
                background: linear-gradient(45deg, #FF6B6B, #4ECDC4);
                color: white;
                padding: 12px 25px;
                border-radius: 25px;
                text-decoration: none;
                font-weight: bold;
                display: inline-block;
                margin-right: 15px;
                transition: all 0.3s ease;
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(0,0,0,0.2)'"
               onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                🛠️ ניהול תוכן
            </a>
        </div>`;

            // החלפת הקישור הקיים
            content = content.replace(
                /<a href="dictionary\.html" class="dictionary-link">.*?<\/a>/s,
                backButton
            );

            await fs.writeFile('quiz.html', content, 'utf8');
            console.log('  ✓ quiz.html עודכן בהצלחה');

        } catch (error) {
            console.log('  ! שגיאה בעדכון quiz.html:', error.message);
        }
    }

    // הוספת קישור לממשק הניהול
    async addAdminLink() {
        console.log('🔗 מוסיף קישורים לממשק הניהול...');

        // יצירת דף קישורים קיימים אם לא קיים
        const quickLinksContent = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>קישורים מהירים - מדריך יוניסטרים</title>
    <style>
        body {
            font-family: Assistant, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
            background-size: 400% 400%;
            animation: gradient 15s ease infinite;
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }

        .container {
            background: rgba(255, 255, 255, 0.95);
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
            backdrop-filter: blur(4px);
            text-align: center;
            max-width: 600px;
            width: 100%;
        }

        h1 {
            background: linear-gradient(45deg, #007bff, #00bcd4);
            background-clip: text;
            -webkit-background-clip: text;
            color: transparent;
            font-size: 2.5em;
            margin-bottom: 30px;
        }

        .links-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }

        .link-card {
            background: white;
            padding: 25px;
            border-radius: 15px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
            text-decoration: none;
            color: inherit;
        }

        .link-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }

        .link-card h3 {
            color: #007bff;
            margin: 0 0 15px 0;
            font-size: 1.3em;
        }

        .link-card p {
            color: #666;
            margin: 0;
            font-size: 0.9em;
        }

        .main-links {
            margin-bottom: 40px;
        }

        .admin-link {
            background: linear-gradient(45deg, #FF6B6B, #4ECDC4) !important;
            color: white !important;
        }

        .admin-link h3,
        .admin-link p {
            color: white !important;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 מדריך יוניסטרים</h1>
        <p>בחר את הכלי שברצונך להשתמש בו:</p>

        <div class="main-links">
            <div class="links-grid">
                <a href="index.html" class="link-card">
                    <h3>📚 המדריך המלא</h3>
                    <p>המדריך המקיף למובילי ומנהלי מרכזי יזמות</p>
                </a>

                <a href="quiz.html" class="link-card">
                    <h3>🧪 בחן את עצמך</h3>
                    <p>בחינה אינטראקטיבית לבדיקת השליטה בחומר</p>
                </a>

                <a href="admin.html" class="link-card admin-link">
                    <h3>🛠️ ניהול תוכן</h3>
                    <p>ממשק לעריכה וניהול של המדריך והבחינות</p>
                </a>
            </div>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 0.9em;">
                💡 <strong>טיפ:</strong> השתמש במערכת ניהול התוכן כדי לעדכן ולהוסיף מידע למדריך בקלות
            </p>
        </div>
    </div>
</body>
</html>`;

        try {
            await fs.writeFile('links.html', quickLinksContent, 'utf8');
            console.log('  ✓ נוצר דף קישורים מהירים');
        } catch (error) {
            console.log('  ! שגיאה ביצירת דף הקישורים:', error.message);
        }
    }

    // בדיקת תקינות העדכון
    async validateUpdate() {
        console.log('🔍 בודק תקינות העדכון...');

        const checks = [
            { file: 'index.html', check: 'content-manager.js', name: 'סקריפט ניהול תוכן' },
            { file: 'quiz.html', check: 'quiz-management', name: 'מטה-תג ניהול בחינה' },
            { file: 'admin.html', check: 'מערכת ניהול תוכן', name: 'ממשק ניהול' },
            { file: 'links.html', check: 'מדריך יוניסטרים', name: 'דף קישורים' }
        ];

        let allValid = true;

        for (const check of checks) {
            try {
                const content = await fs.readFile(check.file, 'utf8');
                if (content.includes(check.check)) {
                    console.log(`  ✅ ${check.name} - תקין`);
                } else {
                    console.log(`  ❌ ${check.name} - לא נמצא`);
                    allValid = false;
                }
            } catch (error) {
                console.log(`  ❌ ${check.name} - קובץ לא נמצא`);
                allValid = false;
            }
        }

        return allValid;
    }
}

// הפעלה
if (require.main === module) {
    const updater = new FileUpdater();
    updater.updateFiles().then(async () => {
        // בדיקת תקינות
        const isValid = await updater.validateUpdate();
        if (isValid) {
            console.log('\n🎉 כל הבדיקות עברו בהצלחה!');
            console.log('\n📖 הוראות שימוש:');
            console.log('1. פתח את links.html בדפדפן להתחלה מהירה');
            console.log('2. השתמש ב-admin.html לניהול התוכן');
            console.log('3. הרץ "npm run dev" לפיתוח מקומי');
        } else {
            console.log('\n⚠️  יש בעיות בחלק מהקבצים - בדוק את הלוגים למעלה');
        }
    });
}

module.exports = FileUpdater;