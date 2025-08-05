/**
 * Netlify Function לשמירת קבצים
 * מאפשר שמירה אוטומטית של קבצי HTML ו-JSON
 */

const fs = require('fs').promises;
const path = require('path');

exports.handler = async (event, context) => {
    // בדיקת שיטת HTTP
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { filename, content, options = {} } = JSON.parse(event.body);

        // בדיקת תקינות הנתונים
        if (!filename || !content) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing filename or content' })
            };
        }

        // בדיקת הרשאות (פשוטה)
        const allowedExtensions = ['.html', '.json', '.js', '.css'];
        const ext = path.extname(filename);
        if (!allowedExtensions.includes(ext)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'File type not allowed' })
            };
        }

        // יצירת נתיב הקובץ
        const filePath = path.join(process.cwd(), 'public', filename);
        
        // וידוא קיום התיקייה
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });

        // שמירת הקובץ
        await fs.writeFile(filePath, content, 'utf8');

        // רישום פעילות (log)
        console.log(`File saved: ${filename} at ${new Date().toISOString()}`);

        // יצירת גיבוי אוטומטי אם נדרש
        if (options.createBackup) {
            const backupPath = path.join(process.cwd(), 'backups', `${Date.now()}-${filename}`);
            await fs.mkdir(path.dirname(backupPath), { recursive: true });
            await fs.writeFile(backupPath, content, 'utf8');
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: true,
                filename,
                savedAt: new Date().toISOString(),
                size: content.length
            })
        };

    } catch (error) {
        console.error('Error saving file:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message
            })
        };
    }
};