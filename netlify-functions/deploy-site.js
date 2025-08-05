/**
 * Netlify Function לפרסום האתר
 * מטפל בעדכון האתר ופרסום אוטומטי
 */

const fs = require('fs').promises;
const path = require('path');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { timestamp, options = {} } = JSON.parse(event.body);

        console.log(`Starting deployment at ${timestamp}`);

        // קריאת נתוני התוכן העדכניים
        const contentPath = path.join(process.cwd(), 'public', 'data', 'content.json');
        const quizPath = path.join(process.cwd(), 'public', 'data', 'quiz.json');
        const imagesPath = path.join(process.cwd(), 'public', 'data', 'images-index.json');

        let contentData = [];
        let quizData = [];
        let imagesData = [];

        try {
            const contentFile = await fs.readFile(contentPath, 'utf8');
            contentData = JSON.parse(contentFile);
        } catch (error) {
            console.log('No content data found, using empty array');
        }

        try {
            const quizFile = await fs.readFile(quizPath, 'utf8');
            quizData = JSON.parse(quizFile);
        } catch (error) {
            console.log('No quiz data found, using empty array');
        }

        try {
            const imagesFile = await fs.readFile(imagesPath, 'utf8');
            imagesData = JSON.parse(imagesFile);
        } catch (error) {
            console.log('No images data found, using empty array');
        }

        // עדכון index.html
        const updatedIndexHTML = await generateIndexHTML(contentData, imagesData);
        const indexPath = path.join(process.cwd(), 'public', 'index.html');
        await fs.writeFile(indexPath, updatedIndexHTML, 'utf8');

        // עדכון quiz.html
        const updatedQuizHTML = await generateQuizHTML(quizData);
        const quizHtmlPath = path.join(process.cwd(), 'public', 'quiz.html');
        await fs.writeFile(quizHtmlPath, updatedQuizHTML, 'utf8');

        // יצירת sitemap.xml
        const sitemap = generateSitemap(contentData);
        const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
        await fs.writeFile(sitemapPath, sitemap, 'utf8');

        // יצירת robots.txt
        const robots = generateRobotsTxt();
        const robotsPath = path.join(process.cwd(), 'public', 'robots.txt');
        await fs.writeFile(robotsPath, robots, 'utf8');

        // רישום הפרסום
        const deploymentLog = {
            timestamp: new Date().toISOString(),
            contentItems: contentData.length,
            quizQuestions: quizData.length,
            images: imagesData.length,
            success: true
        };

        const logPath = path.join(process.cwd(), 'public', 'data', 'deployment-log.json');
        let logs = [];
        try {
            const existingLogs = await fs.readFile(logPath, 'utf8');
            logs = JSON.parse(existingLogs);
        } catch (error) {
            // אם אין קובץ לוג קיים, נתחיל עם מערך ריק
        }

        logs.push(deploymentLog);
        // שמירה של 50 הלוגים האחרונים בלבד
        if (logs.length > 50) {
            logs = logs.slice(-50);
        }

        await fs.writeFile(logPath, JSON.stringify(logs, null, 2), 'utf8');

        console.log(`Deployment completed successfully at ${new Date().toISOString()}`);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: true,
                deploymentLog,
                message: 'Site deployed successfully'
            })
        };

    } catch (error) {
        console.error('Deployment error:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                error: 'Deployment failed',
                message: error.message
            })
        };
    }
};

// פונקציה ליצירת HTML מעודכן
async function generateIndexHTML(contentData, imagesData) {
    // קריאת התבנית הבסיסית
    const templatePath = path.join(process.cwd(), 'templates', 'index-template.html');
    let template;
    
    try {
        template = await fs.readFile(templatePath, 'utf8');
    } catch (error) {
        // אם אין תבנית, נשתמש בתבנית בסיסית
        template = getDefaultIndexTemplate();
    }

    // יצירת תוכן HTML לפי הקטגוריות
    let dictionaryContent = '';
    const categories = groupContentByCategory(contentData);
    
    Object.keys(categories).forEach(categoryKey => {
        const categoryName = getCategoryName(categoryKey);
        dictionaryContent += `<h2 id="${categoryKey}" style="color: #007bff; margin: 40px 0 20px;">${categoryName}</h2>\n`;
        
        categories[categoryKey].forEach(item => {
            dictionaryContent += generateContentItemHTML(item);
        });
    });

    // החלפת התוכן בתבנית
    return template.replace('{{DICTIONARY_CONTENT}}', dictionaryContent);
}

// פונקציה ליצירת HTML לבחינה
async function generateQuizHTML(quizData) {
    const templatePath = path.join(process.cwd(), 'templates', 'quiz-template.html');
    let template;
    
    try {
        template = await fs.readFile(templatePath, 'utf8');
    } catch (error) {
        template = getDefaultQuizTemplate();
    }

    const questionsJS = JSON.stringify(quizData, null, 8);
    return template.replace('{{QUIZ_QUESTIONS}}', questionsJS);
}

// קיבוץ תוכן לפי קטגוריות
function groupContentByCategory(contentData) {
    const categories = {};
    
    contentData.forEach(item => {
        if (!categories[item.category]) {
            categories[item.category] = [];
        }
        categories[item.category].push(item);
    });
    
    return categories;
}

// קבלת שם קטגוריה בעברית
function getCategoryName(category) {
    const categories = {
        'programs': 'תכניות',
        'events': 'אירועים',
        'systems': 'מערכות',
        'documents': 'טפסים ומסמכים חשובים',
        'training': 'הכשרות והדרכה',
        'mentoring': 'ליווי ומנטורינג',
        'budget': 'תקציב ותפעול'
    };
    return categories[category] || category;
}

// יצירת HTML לפריט תוכן
function generateContentItemHTML(item) {
    let linksHTML = '';
    if (item.links && item.links.length > 0) {
        linksHTML = item.links.map(link => {
            const [url, title] = link.split('|');
            return `<a href="${url}" class="system-link" target="_blank">${title || url}</a>`;
        }).join('\n');
    }

    const slug = item.term.toLowerCase()
        .replace(/[^א-ת\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();

    return `
        <div id="${slug}" class="dictionary-item">
            <div class="term">${item.term}</div>
            <div class="definition">
                ${item.definition}
                ${linksHTML}
            </div>
        </div>
    `;
}

// יצירת sitemap.xml
function generateSitemap(contentData) {
    const baseUrl = process.env.URL || 'https://uniguide.netlify.app';
    
    let urls = `
    <url>
        <loc>${baseUrl}/</loc>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>${baseUrl}/quiz.html</loc>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>`;

    // הוספת URLs לכל פריט תוכן
    contentData.forEach(item => {
        const slug = item.term.toLowerCase()
            .replace(/[^א-ת\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .trim();
        
        urls += `
    <url>
        <loc>${baseUrl}/#${slug}</loc>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
    </url>`;
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls}
</urlset>`;
}

// יצירת robots.txt
function generateRobotsTxt() {
    const baseUrl = process.env.URL || 'https://uniguide.netlify.app';
    
    return `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml`;
}

// תבנית בסיסית ל-index.html
function getDefaultIndexTemplate() {
    return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>המדריך המלא למובילי/ות ומנהלי/ות מרכזי יזמות - יוניסטרים</title>
    <!-- CSS יכול להיות כאן -->
</head>
<body>
    <div class="container">
        <h1>המדריך המלא למובילי/ות ומנהלי/ות מרכזי יזמות</h1>
        {{DICTIONARY_CONTENT}}
    </div>
</body>
</html>`;
}

// תבנית בסיסית ל-quiz.html
function getDefaultQuizTemplate() {
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
        <!-- קוד הבחינה כאן -->
    </div>
    <script>
        const questions = {{QUIZ_QUESTIONS}};
        // שאר קוד הבחינה כאן
    </script>
</body>
</html>`;
}