/**
 * תסריט הגדרה ראשונית של מערכת הניהול
 * מטפל בהכנת הסביבה ובעדכון הקבצים הקיימים
 */

const fs = require('fs').promises;
const path = require('path');

class SetupManager {
    constructor() {
        this.projectRoot = process.cwd();
        this.publicDir = path.join(this.projectRoot, 'public');
        this.dataDir = path.join(this.publicDir, 'data');
        this.imagesDir = path.join(this.publicDir, 'images');
        this.templatesDir = path.join(this.projectRoot, 'templates');
    }

    async run() {
        console.log('🚀 מתחיל הגדרה של מערכת ניהול התוכן...\n');

        try {
            await this.createDirectoryStructure();
            await this.createTemplates();
            await this.migrateExistingContent();
            await this.createDefaultData();
            await this.updateExistingFiles();
            
            console.log('\n✅ ההגדרה הושלמה בהצלחה!');
            console.log('\n📋 הוראות שימוש:');
            console.log('1. הרץ: npm run dev - להפעלת שרת פיתוח');
            console.log('2. פתח: http://localhost:8888/admin.html - לממשק הניהול');
            console.log('3. הרץ: npm run deploy - לפרסום באתר');
            
        } catch (error) {
            console.error('❌ שגיאה בהגדרה:', error.message);
            process.exit(1);
        }
    }

    // יצירת מבנה תיקיות
    async createDirectoryStructure() {
        console.log('📁 יוצר מבנה תיקיות...');
        
        const directories = [
            this.publicDir,
            this.dataDir,
            path.join(this.imagesDir, 'originals'),
            path.join(this.imagesDir, 'optimized'),
            path.join(this.imagesDir, 'thumbnails'),
            this.templatesDir,
            path.join(this.projectRoot, 'backups')
        ];

        for (const dir of directories) {
            await fs.mkdir(dir, { recursive: true });
            console.log(`  ✓ ${path.relative(this.projectRoot, dir)}`);
        }
    }

    // יצירת תבניות HTML
    async createTemplates() {
        console.log('📄 יוצר תבניות HTML...');

        // תבנית לדף הראשי
        const indexTemplate = await this.createIndexTemplate();
        await fs.writeFile(
            path.join(this.templatesDir, 'index-template.html'),
            indexTemplate,
            'utf8'
        );
        console.log('  ✓ index-template.html');

        // תבנית לדף הבחינה
        const quizTemplate = await this.createQuizTemplate();
        await fs.writeFile(
            path.join(this.templatesDir, 'quiz-template.html'),
            quizTemplate,
            'utf8'
        );
        console.log('  ✓ quiz-template.html');
    }

    // יצירת תבנית דף ראשי
    async createIndexTemplate() {
        let existingContent = '';
        
        try {
            // ניסיון לקרוא את הקובץ הקיים
            existingContent = await fs.readFile('index.html', 'utf8');
        } catch (error) {
            console.log('  ! קובץ index.html לא נמצא, יוצר תבנית בסיסית');
        }

        if (existingContent) {
            // אם יש תוכן קיים, נוסיף placeholder למקום הרלוונטי
            return existingContent.replace(
                /<div class="dictionary-content">[\s\S]*?<\/div>/,
                '<div class="dictionary-content">{{DICTIONARY_CONTENT}}</div>'
            );
        }

        // תבנית בסיסית אם אין קובץ קיים
        return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>המדריך המלא למובילי/ות ומנהלי/ות מרכזי יזמות - יוניסטרים</title>
    <style>
        /* CSS יכלול כאן */
    </style>
</head>
<body>
    <div class="container">
        <h1>המדריך המלא למובילי/ות ומנהלי/ות מרכזי יזמות</h1>
        <div class="dictionary-content">
            {{DICTIONARY_CONTENT}}
        </div>
    </div>
    <script>
        /* JavaScript יכלול כאן */
    </script>
</body>
</html>`;
    }

    // יצירת תבנית דף בחינה
    async createQuizTemplate() {
        let existingContent = '';
        
        try {
            existingContent = await fs.readFile('quiz.html', 'utf8');
        } catch (error) {
            console.log('  ! קובץ quiz.html לא נמצא, יוצר תבנית בסיסית');
        }

        if (existingContent) {
            // החלפת מערך השאלות בקיים
            return existingContent.replace(
                /const questions = \[[\s\S]*?\];/,
                'const questions = {{QUIZ_QUESTIONS}};'
            );
        }

        return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>בחן את עצמך - המדריך המלא</title>
</head>
<body>
    <div class="container">
        <h1>בחן את עצמך</h1>
        <!-- תוכן הבחינה כאן -->
    </div>
    <script>
        const questions = {{QUIZ_QUESTIONS}};
        /* שאר קוד הבחינה כאן */
    </script>
</body>
</html>`;
    }

    // מעבר תוכן קיים למערכת החדשה
    async migrateExistingContent() {
        console.log('🔄 מעביר תוכן קיים למערכת החדשה...');

        try {
            // ניתוח תוכן מ-index.html
            const indexContent = await fs.readFile('index.html', 'utf8');
            const parsedContent = this.parseExistingHTML(indexContent);
            
            if (parsedContent.length > 0) {
                await fs.writeFile(
                    path.join(this.dataDir, 'content.json'),
                    JSON.stringify(parsedContent, null, 2),
                    'utf8'
                );
                console.log(`  ✓ הועברו ${parsedContent.length} פריטי תוכן`);
            }

            // ניתוח שאלות מ-quiz.html
            const quizContent = await fs.readFile('quiz.html', 'utf8');
            const parsedQuiz = this.parseExistingQuiz(quizContent);
            
            if (parsedQuiz.length > 0) {
                await fs.writeFile(
                    path.join(this.dataDir, 'quiz.json'),
                    JSON.stringify(parsedQuiz, null, 2),
                    'utf8'
                );
                console.log(`  ✓ הועברו ${parsedQuiz.length} שאלות בחינה`);
            }

        } catch (error) {
            console.log('  ! לא נמצא תוכן קיים להעברה');
        }
    }

    // ניתוח HTML קיים
    parseExistingHTML(htmlContent) {
        const content = [];
        const regex = /<div[^>]*class="dictionary-item"[^>]*>[\s\S]*?<\/div>/g;
        const matches = htmlContent.match(regex) || [];

        matches.forEach((match, index) => {
            const termMatch = match.match(/<div[^>]*class="term"[^>]*>(.*?)<\/div>/s);
            const definitionMatch = match.match(/<div[^>]*class="definition"[^>]*>(.*?)<\/div>/s);
            
            if (termMatch && definitionMatch) {
                const term = termMatch[1].replace(/<[^>]*>/g, '').trim();
                const definition = definitionMatch[1].replace(/<[^>]*>/g, '').trim();
                
                content.push({
                    id: Date.now() + index,
                    term: term,
                    definition: definition,
                    category: 'general',
                    links: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }
        });

        return content;
    }

    // ניתוח בחינה קיימת
    parseExistingQuiz(htmlContent) {
        const questions = [];
        const regex = /const questions = (\[[\s\S]*?\]);/;
        const match = htmlContent.match(regex);

        if (match) {
            try {
                const existingQuestions = eval(match[1]);
                return existingQuestions.map((q, index) => ({
                    id: Date.now() + index,
                    question: q.question,
                    options: q.options,
                    correct: q.correct,
                    createdAt: new Date().toISOString()
                }));
            } catch (error) {
                console.log('  ! שגיאה בניתוח שאלות קיימות');
            }
        }

        return questions;
    }

    // יצירת נתונים ברירת מחדל
    async createDefaultData() {
        console.log('📊 יוצר נתוני ברירת מחדל...');

        // בדיקה אם יש כבר נתונים
        const contentExists = await this.fileExists(path.join(this.dataDir, 'content.json'));
        const quizExists = await this.fileExists(path.join(this.dataDir, 'quiz.json'));

        if (!contentExists) {
            const defaultContent = this.getDefaultContent();
            await fs.writeFile(
                path.join(this.dataDir, 'content.json'),
                JSON.stringify(defaultContent, null, 2),
                'utf8'
            );
            console.log('  ✓ נוצרו נתוני תוכן ברירת מחדל');
        }

        if (!quizExists) {
            const defaultQuiz = this.getDefaultQuiz();
            await fs.writeFile(
                path.join(this.dataDir, 'quiz.json'),
                JSON.stringify(defaultQuiz, null, 2),
                'utf8'
            );
            console.log('  ✓ נוצרו שאלות בחינה ברירת מחדל');
        }

        // יצירת קובץ תמונות ריק
        const imagesIndexPath = path.join(this.dataDir, 'images-index.json');
        if (!await this.fileExists(imagesIndexPath)) {
            await fs.writeFile(imagesIndexPath, JSON.stringify([], null, 2), 'utf8');
            console.log('  ✓ נוצר קובץ אינדקס תמונות');
        }
    }

    // עדכון קבצים קיימים
    async updateExistingFiles() {
        console.log('🔧 מעדכן קבצים קיימים...');

        // העתקת קבצים ל-public
        const filesToCopy = ['index.html', 'quiz.html', 'admin.html'];
        
        for (const file of filesToCopy) {
            if (await this.fileExists(file)) {
                await fs.copyFile(file, path.join(this.publicDir, file));
                console.log(`  ✓ הועתק ${file} ל-public`);
            }
        }

        // העתקת קבצי JavaScript
        const jsFiles = ['content-manager.js', 'mcp-integration.js'];
        
        for (const file of jsFiles) {
            if (await this.fileExists(file)) {
                await fs.copyFile(file, path.join(this.publicDir, file));
                console.log(`  ✓ הועתק ${file} ל-public`);
            }
        }
    }

    // בדיקת קיום קובץ
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    // נתוני תוכן ברירת מחדל
    getDefaultContent() {
        return [
            {
                id: 1,
                term: "Edventure",
                definition: "תכנית הדגל של יוניסטרים, תכנית תלת שנתית (שנים ט'-י\"א) המכשירה בני נוער מהפריפריה ליזמות עסקית, חברתית וטכנולוגית.",
                category: "programs",
                links: ["https://unistream1.sharepoint.com|צפה בסילבוס התכנית"],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 2,
                term: "Salesforce",
                definition: "מערכת לתיעוד מפגשים, רישום ומעקב נוכחות חניכים. יש לעדכן בסוף כל יום או לכל המאוחר עד יום חמישי של אותו שבוע.",
                category: "systems",
                links: ["https://unistream.my.salesforce.com|כניסה למערכת Salesforce"],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
    }

    // שאלות בחינה ברירת מחדל
    getDefaultQuiz() {
        return [
            {
                id: 1,
                question: "מהי תכנית Edventure?",
                options: [
                    "תכנית חד שנתית",
                    "תכנית דו שנתית", 
                    "תכנית תלת שנתית",
                    "תכנית ארבע שנתית"
                ],
                correct: 2,
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                question: "מתי יש לעדכן את מערכת ה-Salesforce?",
                options: [
                    "פעם בחודש",
                    "בסוף כל יום או עד יום חמישי",
                    "פעם בשבוע",
                    "רק בסוף השנה"
                ],
                correct: 1,
                createdAt: new Date().toISOString()
            }
        ];
    }
}

// הפעלת תסריט ההגדרה
if (require.main === module) {
    const setup = new SetupManager();
    setup.run();
}

module.exports = SetupManager;